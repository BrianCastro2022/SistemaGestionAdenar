<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seguridad\StoreColaboradorRequest;
use App\Http\Requests\Seguridad\UpdateColaboradorRequest;
use App\Models\Seguridad\Colaborador;
use App\Services\Seguridad\IndiceRiesgoCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ColaboradorController extends Controller
{
    /**
     * Campos de documentos (PDF/Excel) almacenados en colaboradores/documentos.
     */
    private const DOCUMENTO_FIELDS = [
<<<<<<< HEAD
        // Personales
    'documento_cedula',
    // Tránsito
    'documento_licencia_conduccion',
    'documento_carnet_manejo_defensivo',
    'documento_certificado_manejo_defensivo',
    'documento_simit',
    'documento_recordatorio_vehiculo_licencia_conduccion',
    // Salud
    'documento_eps',
    'documento_pension',
    'documento_examen_medico_ocupacional',
    // Empresariales
    'documento_carnet_ingreso_cd',
    // Académicos
    'documento_titulo_bachiller',
    'documento_titulo_academico',
=======
        'documento_cedula',
        'documento_licencia_conduccion',
        'documento_carnet_manejo_defensivo',
        'documento_certificado_manejo_defensivo',
        'documento_carnet_ingreso_cd',
        'documento_simit',
        'documento_examen_medico_ocupacional',
        'documento_recordatorio_vehiculo_licencia_conduccion',
        'documento_eps',
        'documento_pension',
        'documento_titulo_bachiller',
        'documento_titulo_academico',
>>>>>>> a5e4efd (Formulario de los colaboradores y base de datos)
    ];

    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $turno = $request->string('turno')->trim()->toString();

        $colaboradores = Colaborador::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('cedula', 'like', "%{$search}%");
                });
            })
            ->when($turno !== '', fn ($query) => $query->where('turno', $turno))
            ->orderBy('nombres')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('seguridad/colaboradores/index', [
            'colaboradores' => $colaboradores,
            'filters' => ['search' => $search, 'turno' => $turno],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('seguridad/colaboradores/create');
    }

    public function store(StoreColaboradorRequest $request): RedirectResponse
    {
        $data = $request->validated();

        foreach (self::DOCUMENTO_FIELDS as $field) {
            unset($data[$field]);
        }

        if ($request->hasFile('imagen')) {
            $data['imagen'] = $request->file('imagen')->store('colaboradores', 'public');
        }

        $colaborador = Colaborador::create([
            ...$data,
            'is_active' => $request->boolean('is_active', true),
        ]);

        $this->storeDocuments($request, $colaborador);

        return to_route('seguridad.colaboradores.index')->with('status', 'Colaborador creado correctamente.');
    }

    public function show(Colaborador $colaborador, IndiceRiesgoCalculator $calculator): Response
    {
        return Inertia::render('seguridad/colaboradores/show', [
            'colaborador' => $colaborador,
            'indiceRiesgo' => $calculator->calcular($colaborador),
            'pruebas' => $colaborador->pruebasAlcoholemia()
                ->with('alcoholimetro:id,codigo')
                ->latest('fecha_hora')
                ->limit(25)
                ->get(),
            'condicionesSalud' => $colaborador->condicionesSalud()
                ->latest('fecha_hora')
                ->limit(25)
                ->get(),
        ]);
    }

    public function edit(Colaborador $colaborador): Response
    {
        $colaboradorData = $colaborador->toArray();
        $colaboradorData = [...$colaboradorData, ...$this->documentPaths($colaborador)];

        return Inertia::render('seguridad/colaboradores/edit', [
            'colaborador' => $colaboradorData,
        ]);
    }

    public function update(UpdateColaboradorRequest $request, Colaborador $colaborador): RedirectResponse
    {
        $data = $request->validated();

        foreach (self::DOCUMENTO_FIELDS as $field) {
            unset($data[$field]);
        }

        if ($request->hasFile('imagen')) {
            if ($colaborador->imagen) {
                Storage::disk('public')->delete($colaborador->imagen);
            }

            $data['imagen'] = $request->file('imagen')->store('colaboradores', 'public');
        }

        $colaborador->update([
            ...$data,
            'is_active' => $request->boolean('is_active', true),
        ]);

        $this->storeDocuments($request, $colaborador);

        return to_route('seguridad.colaboradores.index')->with('status', 'Colaborador actualizado correctamente.');
    }

    public function destroy(Colaborador $colaborador): RedirectResponse
    {
        foreach ($this->documentPaths($colaborador) as $paths) {
            foreach ($paths as $path) {
                Storage::disk('public')->delete($path);
            }
        }

        $colaborador->delete();

        return to_route('seguridad.colaboradores.index')->with('status', 'Colaborador eliminado correctamente.');
    }

    private function storeDocuments(Request $request, Colaborador $colaborador): void
    {
        foreach (self::DOCUMENTO_FIELDS as $field) {
            $files = $request->file($field, []);
            $files = is_array($files) ? $files : [$files];

            foreach (array_filter($files) as $file) {
                $colaborador->documentos()->create([
                    'campo' => $field,
                    'path' => $file->store('colaboradores/documentos', 'public'),
                    'fecha_documento' => now()->toDateString(),
                ]);
            }
        }
    }

    private function documentPaths(Colaborador $colaborador): array
    {
        $paths = [];

        foreach (self::DOCUMENTO_FIELDS as $field) {
            $paths[$field] = $colaborador->{$field}
                ? [['path' => $colaborador->{$field}, 'fecha' => null]]
                : [];
        }

        foreach ($colaborador->documentos as $documento) {
            $paths[$documento->campo][] = [
                'path' => $documento->path,
                'fecha' => $documento->fecha_documento?->format('Y-m-d'),
            ];
        }

        return $paths;
    }
}
