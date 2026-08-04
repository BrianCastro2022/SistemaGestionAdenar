<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seguridad\StoreAsignacionConductorRequest;
use App\Models\Seguridad\AsignacionConductor;
use App\Models\Seguridad\Colaborador;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class AsignacionConductorController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $asignaciones = AsignacionConductor::query()
            ->with('colaborador:id,cedula,nombres,apellidos')
            ->when($search !== '', function ($query) use ($search) {
                $query->where('cedula', 'like', "%{$search}%")
                    ->orWhereHas('colaborador', function ($query) use ($search) {
                        $query->where('nombres', 'like', "%{$search}%")
                            ->orWhere('apellidos', 'like', "%{$search}%");
                    });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('seguridad/asignaciones-conductores/index', [
            'asignaciones' => $asignaciones,
            'filters' => ['search' => $search],
        ]);
    }

    public function edit(AsignacionConductor $asignaciones_conductore): Response
    {
        $colaborador = $asignaciones_conductore->colaborador;

        return Inertia::render('seguridad/asignaciones-conductores/create', [
            'colaborador' => $colaborador ? [
                'id' => $colaborador->id,
                'cedula' => $colaborador->cedula,
                'nombres' => $colaborador->nombres,
                'apellidos' => $colaborador->apellidos,
                'cargo' => $colaborador->cargo,
                'area' => $colaborador->area,
            ] : null,
            'asignacion' => $asignaciones_conductore,
            'positiveTests' => $this->resolvePositiveAlcoholTestHistory($colaborador),
        ]);
    }

    protected function resolvePositiveAlcoholTestHistory(?Colaborador $colaborador): array
    {
        if (!$colaborador) {
            return [];
        }

        return $colaborador->pruebasAlcoholemia()
            ->where('estado', 'realizada')
            ->where('es_positivo', true)
            ->orderByDesc('fecha_hora')
            ->get(['id', 'fecha_hora', 'resultado', 'tipo'])
            ->map(fn ($prueba) => [
                'id' => $prueba->id,
                'fecha_hora' => $prueba->fecha_hora?->format('Y-m-d H:i') ?? '',
                'resultado' => $prueba->resultado !== null ? (string) $prueba->resultado : '',
                'tipo' => $prueba->tipo,
            ])
            ->toArray();
    }

    protected function resolveAlcoholUsageFromTests(?Colaborador $colaborador): string
    {
        if (!$colaborador) {
            return '';
        }

        $latestPositive = $colaborador->pruebasAlcoholemia()
            ->where('estado', 'realizada')
            ->where('es_positivo', true)
            ->latest('fecha_hora')
            ->first();

        if ($latestPositive) {
            return 'Sí';
        }

        $latestNegative = $colaborador->pruebasAlcoholemia()
            ->where('estado', 'realizada')
            ->where('es_positivo', false)
            ->latest('fecha_hora')
            ->first();

        if ($latestNegative) {
            return 'No';
        }

        return '';
    }

    public function create(Request $request): Response|RedirectResponse
    {
        $colaborador = null;
        $colaboradorId = $request->query('colaborador_id');
        $cedula = $request->query('cedula');

        if ($colaboradorId) {
            $colaborador = Colaborador::find($colaboradorId);
        } elseif ($cedula) {
            $colaborador = Colaborador::where('cedula', $cedula)->first();
        }

        if ($colaborador) {
            $existing = AsignacionConductor::where('colaborador_id', $colaborador->id)
                ->orWhere(function ($query) use ($colaborador) {
                    $query->whereNotNull('cedula')->where('cedula', $colaborador->cedula);
                })
                ->latest()
                ->first();

            if ($existing) {
                return to_route('seguridad.asignaciones-conductores.edit', $existing);
            }
        }

        return Inertia::render('seguridad/asignaciones-conductores/create', [
            'colaborador' => $colaborador ? [
                'id' => $colaborador->id,
                'cedula' => $colaborador->cedula,
                'nombres' => $colaborador->nombres,
                'apellidos' => $colaborador->apellidos,
                'cargo' => $colaborador->cargo,
                'area' => $colaborador->area,
            ] : null,
            'alcoholUsageHint' => $this->resolveAlcoholUsageFromTests($colaborador),
            'positiveTests' => $this->resolvePositiveAlcoholTestHistory($colaborador),
        ]);
    }

    public function store(StoreAsignacionConductorRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $colaborador = null;
        if (!empty($data['colaborador_id'])) {
            $colaborador = Colaborador::find($data['colaborador_id']);
        } elseif (!empty($data['cedula'])) {
            $colaborador = Colaborador::where('cedula', $data['cedula'])->first();
        }

        if ($colaborador) {
            $data['colaborador_id'] = $colaborador->id;
            $data['cedula'] = $colaborador->cedula;
        }

        $existing = null;
        if (!empty($data['colaborador_id'])) {
            $existing = AsignacionConductor::where('colaborador_id', $data['colaborador_id'])->latest()->first();
        } elseif (!empty($data['cedula'])) {
            $existing = AsignacionConductor::where('cedula', $data['cedula'])->latest()->first();
        }

        if ($existing) {
            $existing->update($data);

            return to_route('seguridad.asignaciones-conductores.index')->with('status', 'La evaluación del conductor se actualizó correctamente.');
        }

        AsignacionConductor::create($data);

        return to_route('seguridad.asignaciones-conductores.index')->with('status', 'Asignación de conductor registrada correctamente.');
    }
}
