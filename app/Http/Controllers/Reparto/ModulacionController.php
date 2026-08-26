<?php

namespace App\Http\Controllers\Reparto;

use App\Http\Controllers\Controller;
use App\Models\Flota\Vehiculo;
use App\Models\Reparto\Modulacion;
use App\Models\Reparto\ModulacionItem;
use App\Models\Reparto\ModulacionNovedad;
use App\Models\Seguridad\Colaborador;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ModulacionController extends Controller
{
    private function ensureFijoColumnExists(): void
    {
        if (Schema::hasTable('modulacion_novedades') && ! Schema::hasColumn('modulacion_novedades', 'fijo')) {
            Schema::table('modulacion_novedades', function (Blueprint $table) {
                $table->boolean('fijo')->default(false)->after('cargo');
            });
        }
    }

    public function index(Request $request): Response
    {
        $this->ensureFijoColumnExists();

        $fecha = $request->input('fecha', date('Y-m-d'));

        $modulacion = Modulacion::with(['items', 'novedades'])
            ->where('fecha', $fecha)
            ->first();

        $colaboradores = Colaborador::select(['id', 'cedula', 'nombres', 'apellidos', 'cargo'])
            ->where('is_active', true)
            ->orderBy('nombres')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'cedula' => $c->cedula,
                    'nombres' => $c->nombres,
                    'apellidos' => $c->apellidos,
                    'nombre_completo' => trim("{$c->nombres} {$c->apellidos}"),
                    'cargo' => $c->cargo ?? '',
                ];
            });

        $cargos = Colaborador::whereNotNull('cargo')
            ->where('cargo', '!=', '')
            ->distinct()
            ->orderBy('cargo')
            ->pluck('cargo');

        $vehiculos = Vehiculo::where('is_active', true)
            ->orderBy('placa')
            ->pluck('placa');

        $currentUser = $request->user()?->name ?? '';
        $readOnly = $request->boolean('readOnly', false);

        return Inertia::render('reparto/modulacion/index', [
            'fecha' => (string) $fecha,
            'modulacion' => $modulacion,
            'colaboradores' => $colaboradores,
            'cargos' => $cargos,
            'vehiculos' => $vehiculos,
            'currentUser' => $currentUser,
            'readOnly' => $readOnly,
        ]);
    }

    public function historial(Request $request): Response
    {
        $search = $request->input('search', '');
        $perPage = 20;

        $query = Modulacion::withCount('items')
            ->with(['novedades'])
            ->orderBy('fecha', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('fecha', 'like', "%{$search}%")
                  ->orWhere('ud_programado_por', 'like', "%{$search}%")
                  ->orWhere('despachado_por_nombre', 'like', "%{$search}%");
            });
        }

        $planeaciones = $query->paginate($perPage)->withQueryString();

        // Enriquecer cada modulación con resumen de placas y colaboradores
        $planeaciones->getCollection()->transform(function (Modulacion $mod) {
            $items = $mod->load('items')->items;
            $placas = $items->pluck('placa')->filter()->unique()->values();
            $totalTripulantes = $items->sum(function ($item) {
                return count($item->tripulacion ?? []);
            });

            return [
                'id'                          => $mod->id,
                'fecha'                       => $mod->fecha,
                'ud_programado_por'           => $mod->ud_programado_por,
                'despachado_por_nombre'       => $mod->despachado_por_nombre,
                'total_rutas'                 => $mod->items_count,
                'total_tripulantes'           => $totalTripulantes,
                'total_novedades'             => $mod->novedades->count(),
                'placas'                      => $placas,
            ];
        });

        return Inertia::render('reparto/modulacion/historial', [
            'planeaciones' => $planeaciones,
            'filters'      => ['search' => $search],
        ]);
    }

    public function storeBatch(Request $request): RedirectResponse
    {
        $this->ensureFijoColumnExists();

        $validated = $request->validate([
            'fecha' => 'required|string|max:255',
            'ud_programado_por' => 'nullable|string|max:255',
            'despachado_por_colaborador_id' => 'nullable|exists:colaboradores,id',
            'despachado_por_nombre' => 'nullable|string|max:255',
            'rutas' => 'required|array|min:1',
            'rutas.*.placa' => 'required|string|max:50',
            'rutas.*.doc_tras' => 'nullable|string|max:100',
            'rutas.*.ud' => 'nullable|string|max:100',
            'rutas.*.cargo' => 'nullable|string|max:100',
            'rutas.*.reunion' => 'nullable|string|max:255',
            'rutas.*.tripulacion' => 'nullable|array',
            'rutas.*.tripulacion.*.colaborador_id' => 'nullable',
            'rutas.*.tripulacion.*.cedula' => 'nullable|string',
            'rutas.*.tripulacion.*.nombres' => 'nullable|string',
            'rutas.*.tripulacion.*.cargo' => 'nullable|string',
            'rutas.*.viajes' => 'nullable|array',
            'rutas.*.viajes.*.lugares' => 'nullable|string|max:255',
            'rutas.*.viajes.*.cliente' => 'nullable|string|max:255',
            'rutas.*.viajes.*.peso' => 'nullable|string|max:100',
            'novedades' => 'nullable|array',
            'novedades.*.id' => 'nullable|integer',
            'novedades.*.fijo' => 'nullable|boolean',
            'novedades.*.permiso' => 'nullable|boolean',
            'novedades.*.incapacidad' => 'nullable|boolean',
            'novedades.*.vacaciones' => 'nullable|boolean',
        ]);

        // Verificar que ningún colaborador esté asignado a más de una ruta en la misma fecha
        $assignedCollaboratorIds = [];
        $assignedCedulas = [];

        foreach ($validated['rutas'] as $rIdx => $ruta) {
            $tripulacion = $ruta['tripulacion'] ?? [];
            foreach ($tripulacion as $miembro) {
                $colId = !empty($miembro['colaborador_id']) ? (string)$miembro['colaborador_id'] : null;
                $ced = !empty($miembro['cedula']) ? trim($miembro['cedula']) : null;
                $nom = $miembro['nombres'] ?? 'Colaborador';

                // Si no es un colaborador fijo de la fecha, verificar duplicación
                if ($colId && in_array($colId, $assignedCollaboratorIds, true)) {
                    $isFijo = ModulacionNovedad::whereHas('modulacion', function($q) use ($validated) {
                        $q->where('fecha', $validated['fecha']);
                    })->where('colaborador_id', $colId)->where('fijo', true)->exists();

                    if (!$isFijo) {
                        return redirect()->back()->withErrors([
                            'rutas' => "El colaborador '{$nom}' ya se encuentra programado en otra ruta para la fecha {$validated['fecha']}.",
                        ]);
                    }
                }
                if ($ced && in_array($ced, $assignedCedulas, true)) {
                    $isFijo = ModulacionNovedad::whereHas('modulacion', function($q) use ($validated) {
                        $q->where('fecha', $validated['fecha']);
                    })->where('cedula', $ced)->where('fijo', true)->exists();

                    if (!$isFijo) {
                        return redirect()->back()->withErrors([
                            'rutas' => "El colaborador con cédula '{$ced}' ({$nom}) ya se encuentra programado en otra ruta para la fecha {$validated['fecha']}.",
                        ]);
                    }
                }

                if ($colId) $assignedCollaboratorIds[] = $colId;
                if ($ced) $assignedCedulas[] = $ced;
            }
        }

        $modulacion = Modulacion::firstOrCreate(
            ['fecha' => $validated['fecha']],
            [
                'ud_programado_por' => $validated['ud_programado_por'] ?? null,
                'despachado_por_colaborador_id' => $validated['despachado_por_colaborador_id'] ?? null,
                'despachado_por_nombre' => $validated['despachado_por_nombre'] ?? null,
                'user_id' => $request->user()?->id,
            ]
        );

        $modulacion->update([
            'ud_programado_por' => $validated['ud_programado_por'] ?? $modulacion->ud_programado_por,
            'despachado_por_colaborador_id' => $validated['despachado_por_colaborador_id'] ?? $modulacion->despachado_por_colaborador_id,
            'despachado_por_nombre' => $validated['despachado_por_nombre'] ?? $modulacion->despachado_por_nombre,
        ]);

        // Reemplazar o guardar rutas de modulación
        $modulacion->items()->delete();

        foreach ($validated['rutas'] as $ruta) {
            $tripulacion = $ruta['tripulacion'] ?? [];
            $firstMember = $tripulacion[0] ?? null;

            $modulacion->items()->create([
                'placa' => $ruta['placa'],
                'doc_tras' => $ruta['doc_tras'] ?? null,
                'ud' => $ruta['ud'] ?? null,
                'cargo' => $ruta['cargo'] ?? ($firstMember['cargo'] ?? null),
                'colaborador_id' => $firstMember['colaborador_id'] ?? null,
                'cedula' => $firstMember['cedula'] ?? null,
                'nombres' => $firstMember['nombres'] ?? null,
                'reunion' => $ruta['reunion'] ?? null,
                'tripulacion' => $tripulacion,
                'viajes' => $ruta['viajes'] ?? [],
            ]);
        }

        // Actualizar novedades si fueron enviadas en el lote
        if (!empty($validated['novedades'])) {
            foreach ($validated['novedades'] as $novItem) {
                if (!empty($novItem['id'])) {
                    ModulacionNovedad::where('id', $novItem['id'])->update([
                        'fijo' => !empty($novItem['fijo']),
                        'permiso' => !empty($novItem['permiso']),
                        'incapacidad' => !empty($novItem['incapacidad']),
                        'vacaciones' => !empty($novItem['vacaciones']),
                    ]);
                }
            }
        }

        return redirect()->back()->with('success', 'Planeación de ruta guardada exitosamente.');
    }

    public function destroyItem(int $id): RedirectResponse
    {
        $item = ModulacionItem::findOrFail($id);
        $item->delete();

        return redirect()->back()->with('success', 'Ruta eliminada de la modulación.');
    }

    public function storeNovedad(Request $request): RedirectResponse
    {
        $this->ensureFijoColumnExists();

        $validated = $request->validate([
            'fecha' => 'required|string',
            'colaborador_id' => 'nullable',
            'cedula' => 'nullable|string|max:100',
            'nombres' => 'nullable|string|max:255',
            'cargo' => 'nullable|string|max:100',
            'fijo' => 'nullable|boolean',
            'permiso' => 'nullable|boolean',
            'incapacidad' => 'nullable|boolean',
            'vacaciones' => 'nullable|boolean',
        ]);

        $modulacion = Modulacion::firstOrCreate(
            ['fecha' => $validated['fecha']],
            ['ud_programado_por' => $request->user()?->name]
        );

        $modulacion->novedades()->create([
            'colaborador_id' => !empty($validated['colaborador_id']) ? (int)$validated['colaborador_id'] : null,
            'cedula' => $validated['cedula'] ?? null,
            'nombres' => $validated['nombres'] ?? null,
            'cargo' => $validated['cargo'] ?? null,
            'fijo' => !empty($validated['fijo']),
            'permiso' => !empty($validated['permiso']),
            'incapacidad' => !empty($validated['incapacidad']),
            'vacaciones' => !empty($validated['vacaciones']),
        ]);

        return redirect()->back()->with('success', 'Novedad agregada exitosamente.');
    }

    public function destroyNovedad(int $id): RedirectResponse
    {
        $novedad = ModulacionNovedad::findOrFail($id);
        $novedad->delete();

        return redirect()->back()->with('success', 'Novedad eliminada.');
    }

    public function updateNovedad(Request $request, int $id): RedirectResponse
    {
        $this->ensureFijoColumnExists();

        $novedad = ModulacionNovedad::findOrFail($id);

        $validated = $request->validate([
            'fijo' => 'boolean',
            'permiso' => 'boolean',
            'incapacidad' => 'boolean',
            'vacaciones' => 'boolean',
        ]);

        $novedad->update($validated);

        return redirect()->back()->with('success', 'Novedad de colaborador actualizada.');
    }
}
