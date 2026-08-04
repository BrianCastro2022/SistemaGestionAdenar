<?php

namespace App\Http\Controllers\Seguridad;

use App\Exports\Seguridad\PruebasExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seguridad\StorePruebaAlcoholemiaRequest;
use App\Models\Seguridad\Alcoholimetro;
use App\Models\Seguridad\Colaborador;
use App\Models\Seguridad\PruebaAlcoholemia;
use App\Services\Seguridad\QrCodeGenerator;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class PruebaAlcoholemiaController extends Controller
{
    public function index(Request $request): Response
    {
        $filtros = $this->filtrosDesdeRequest($request);

        $pruebas = $this->filtrarPruebas($request)
            ->latest('fecha_hora')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('seguridad/pruebas/index', [
            'pruebas' => $pruebas,
            'filters' => $filtros,
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

        $prueba = PruebaAlcoholemia::create([
            'colaborador_id' => $request->input('colaborador_id'),
            'tipo' => $request->input('tipo'),
            'alcoholimetro_id' => $esProgramacion ? null : $request->input('alcoholimetro_id'),
            'resultado' => $esProgramacion ? null : $request->input('resultado'),
            'consentimiento_aceptado' => ! $esProgramacion && $request->boolean('consentimiento_aceptado'),
            'consentimiento_en' => $esProgramacion ? null : Carbon::now(),
            'evidencia_path' => $request->file('evidencia')?->store('evidencias', 'public'),
            'firma_path' => $request->file('firma')?->store('firmas', 'public'),
            'observaciones' => $request->input('observaciones'),
            'responsable_id' => $request->user()->id,
            'fecha_hora' => $esProgramacion ? $request->date('programada_en') : Carbon::now(),
            'programada_en' => $esProgramacion ? $request->date('programada_en') : null,
            'estado' => $esProgramacion ? 'programada' : 'realizada',
        ]);

        foreach ($request->file('evidencias', []) as $archivo) {
            $prueba->evidencias()->create(['path' => $archivo->store('evidencias', 'public')]);
        }

        return to_route('seguridad.pruebas.index')->with(
            'status',
            $esProgramacion ? 'Prueba programada correctamente.' : 'Prueba registrada correctamente.'
        );
    }

    public function edit(PruebaAlcoholemia $prueba, Request $request): Response
    {
        $turno = $request->string('turno')->trim()->toString();

        $dispositivosDisponibles = Alcoholimetro::query()
            ->where(function ($query) use ($prueba) {
                $query->where('estado', 'Disponible');

                if ($prueba->alcoholimetro_id !== null) {
                    $query->orWhere('id', $prueba->alcoholimetro_id);
                }
            })
            ->orderBy('codigo')
            ->get(['id', 'codigo', 'valor_min', 'valor_max']);

        return Inertia::render('seguridad/pruebas/create', [
            'colaboradores' => Colaborador::query()
                ->where('is_active', true)
                ->when($turno !== '', fn ($query) => $query->where('turno', $turno))
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'cedula', 'turno']),
            'dispositivosDisponibles' => $dispositivosDisponibles,
            'filters' => ['turno' => $turno],
            'prueba' => $prueba->load(['colaborador', 'alcoholimetro', 'responsable']),
        ]);
    }

    public function update(StorePruebaAlcoholemiaRequest $request, PruebaAlcoholemia $prueba): RedirectResponse
    {
        $esProgramacion = $request->boolean('es_programacion');

        $prueba->fill([
            'colaborador_id' => $request->input('colaborador_id'),
            'tipo' => $request->input('tipo'),
            'alcoholimetro_id' => $esProgramacion ? null : $request->input('alcoholimetro_id'),
            'resultado' => $esProgramacion ? null : $request->input('resultado'),
            'consentimiento_aceptado' => ! $esProgramacion && $request->boolean('consentimiento_aceptado'),
            'consentimiento_en' => $esProgramacion ? null : ($prueba->consentimiento_en ?? Carbon::now()),
            'observaciones' => $request->input('observaciones'),
            'fecha_hora' => $esProgramacion ? $request->date('programada_en') : ($prueba->fecha_hora ?? Carbon::now()),
            'programada_en' => $esProgramacion ? $request->date('programada_en') : null,
            'estado' => $esProgramacion ? 'programada' : 'realizada',
        ]);

        if ($request->file('evidencia')) {
            $prueba->evidencia_path = $request->file('evidencia')->store('evidencias', 'public');
        }

        if ($request->file('firma')) {
            $prueba->firma_path = $request->file('firma')->store('firmas', 'public');
        }

        $prueba->save();

        foreach ($request->file('evidencias', []) as $archivo) {
            $prueba->evidencias()->create(['path' => $archivo->store('evidencias', 'public')]);
        }

        return to_route('seguridad.pruebas.index')->with(
            'status',
            $esProgramacion ? 'Prueba programada actualizada correctamente.' : 'Prueba actualizada correctamente.'
        );
    }

    public function show(PruebaAlcoholemia $prueba, QrCodeGenerator $qrCodeGenerator): Response
    {
        $prueba->load(['colaborador', 'alcoholimetro', 'responsable:id,name', 'evidencias']);

        $qrSvg = $prueba->qr_token
            ? $qrCodeGenerator->generateSvg(route('seguridad.verificacion', [$prueba->id, $prueba->qr_token]))
            : null;

        return Inertia::render('seguridad/pruebas/show', [
            'prueba' => [
                ...$prueba->toArray(),
                'evaluacion' => $prueba->evaluacion(),
            ],
            'qrSvg' => $qrSvg,
        ]);
    }

    public function calendario(Request $request): Response
    {
        $mes = $request->string('mes')->trim()->toString();
        $inicioMes = $mes !== '' ? Carbon::createFromFormat('Y-m', $mes)->startOfMonth() : Carbon::now()->startOfMonth();

        $pruebas = PruebaAlcoholemia::query()
            ->with('colaborador:id,nombres,apellidos')
            ->where('estado', 'programada')
            ->whereBetween('programada_en', [$inicioMes->clone()->startOfDay(), $inicioMes->clone()->endOfMonth()->endOfDay()])
            ->orderBy('programada_en')
            ->get()
            ->groupBy(fn (PruebaAlcoholemia $prueba) => $prueba->programada_en->toDateString())
            ->map(fn ($grupo) => $grupo->map(fn (PruebaAlcoholemia $prueba) => [
                'id' => $prueba->id,
                'hora' => $prueba->programada_en->format('H:i'),
                'tipo' => $prueba->tipo,
                'colaborador' => $prueba->colaborador?->nombre_completo,
            ]));

        return Inertia::render('seguridad/pruebas/calendario', [
            'mes' => $inicioMes->format('Y-m'),
            'pruebasPorDia' => $pruebas,
        ]);
    }

    public function exportarPdf(Request $request)
    {
        $pruebas = $this->filtrarPruebas($request)->latest('fecha_hora')->get();

        return Pdf::loadView('seguridad.pruebas-pdf', ['pruebas' => $pruebas])
            ->setPaper('a4', 'landscape')
            ->download('pruebas-alcoholemia-'.now()->format('Y-m-d').'.pdf');
    }

    public function exportarExcel(Request $request)
    {
        $pruebas = $this->filtrarPruebas($request)->latest('fecha_hora')->get();

        return Excel::download(new PruebasExport($pruebas), 'pruebas-alcoholemia-'.now()->format('Y-m-d').'.xlsx');
    }

    /**
     * HU025: filtros compartidos por el listado y ambas exportaciones (HU026).
     */
    private function filtrarPruebas(Request $request): Builder
    {
        $filtros = $this->filtrosDesdeRequest($request);

        return PruebaAlcoholemia::query()
            ->with(['colaborador:id,nombres,apellidos,cedula', 'alcoholimetro:id,codigo', 'responsable:id,name', 'evidencias'])
            ->when($filtros['estado'] !== '', fn ($query) => $query->where('estado', $filtros['estado']))
            ->when($filtros['tipo'] !== '', fn ($query) => $query->where('tipo', $filtros['tipo']))
            ->when($filtros['fecha_desde'] !== '', fn ($query) => $query->whereDate('fecha_hora', '>=', $filtros['fecha_desde']))
            ->when($filtros['fecha_hasta'] !== '', fn ($query) => $query->whereDate('fecha_hora', '<=', $filtros['fecha_hasta']))
            ->when($filtros['colaborador'] !== '', function ($query) use ($filtros) {
                $query->whereHas('colaborador', function ($query) use ($filtros) {
                    $query->where('nombres', 'like', "%{$filtros['colaborador']}%")
                        ->orWhere('apellidos', 'like', "%{$filtros['colaborador']}%")
                        ->orWhere('cedula', 'like', "%{$filtros['colaborador']}%");
                });
            });
    }

    /**
     * @return array<string, string>
     */
    private function filtrosDesdeRequest(Request $request): array
    {
        return [
            'estado' => $request->string('estado')->trim()->toString(),
            'tipo' => $request->string('tipo')->trim()->toString(),
            'fecha_desde' => $request->string('fecha_desde')->trim()->toString(),
            'fecha_hasta' => $request->string('fecha_hasta')->trim()->toString(),
            'colaborador' => $request->string('colaborador')->trim()->toString(),
        ];
    }
}
