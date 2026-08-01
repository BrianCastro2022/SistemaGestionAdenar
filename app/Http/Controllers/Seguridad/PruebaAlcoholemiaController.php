<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seguridad\StorePruebaAlcoholemiaRequest;
use App\Models\Seguridad\Alcoholimetro;
use App\Models\Seguridad\Colaborador;
use App\Models\Seguridad\PruebaAlcoholemia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PruebaAlcoholemiaController extends Controller
{
    public function index(Request $request): Response
    {
        $estado = $request->string('estado')->trim()->toString();

        $pruebas = PruebaAlcoholemia::query()
            ->with(['colaborador:id,nombres,apellidos,cedula', 'alcoholimetro:id,codigo', 'responsable:id,name'])
            ->when($estado !== '', fn ($query) => $query->where('estado', $estado))
            ->latest('fecha_hora')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('seguridad/pruebas/index', [
            'pruebas' => $pruebas,
            'filters' => ['estado' => $estado],
        ]);
    }

    public function create(Request $request): Response
    {
        $turno = $request->string('turno')->trim()->toString();

        return Inertia::render('seguridad/pruebas/create', [
            'colaboradores' => Colaborador::query()
                ->where('is_active', true)
                ->when($turno !== '', fn ($query) => $query->where('turno', $turno))
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'cedula', 'turno']),
            'dispositivosDisponibles' => Alcoholimetro::query()
                ->where('estado', 'Disponible')
                ->orderBy('codigo')
                ->get(['id', 'codigo', 'valor_min', 'valor_max']),
            'filters' => ['turno' => $turno],
        ]);
    }

    public function store(StorePruebaAlcoholemiaRequest $request): RedirectResponse
    {
        $esProgramacion = $request->boolean('es_programacion');

        PruebaAlcoholemia::create([
            'colaborador_id' => $request->input('colaborador_id'),
            'tipo' => $request->input('tipo'),
            'alcoholimetro_id' => $esProgramacion ? null : $request->input('alcoholimetro_id'),
            'resultado' => $esProgramacion ? null : $request->input('resultado'),
            'consentimiento_aceptado' => ! $esProgramacion && $request->boolean('consentimiento_aceptado'),
            'consentimiento_en' => $esProgramacion ? null : Carbon::now(),
            'evidencia_path' => $request->file('evidencia')?->store('evidencias', 'public'),
            'observaciones' => $request->input('observaciones'),
            'responsable_id' => $request->user()->id,
            'fecha_hora' => $esProgramacion ? $request->date('programada_en') : Carbon::now(),
            'programada_en' => $esProgramacion ? $request->date('programada_en') : null,
            'estado' => $esProgramacion ? 'programada' : 'realizada',
        ]);

        return to_route('seguridad.pruebas.index')->with(
            'status',
            $esProgramacion ? 'Prueba programada correctamente.' : 'Prueba registrada correctamente.'
        );
    }

    public function show(PruebaAlcoholemia $prueba): Response
    {
        $prueba->load(['colaborador', 'alcoholimetro', 'responsable:id,name']);

        return Inertia::render('seguridad/pruebas/show', [
            'prueba' => [
                ...$prueba->toArray(),
                'evaluacion' => $prueba->evaluacion(),
            ],
        ]);
    }
}
