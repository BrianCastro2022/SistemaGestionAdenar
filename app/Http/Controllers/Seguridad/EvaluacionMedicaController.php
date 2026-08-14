<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Models\Seguridad\Colaborador;
use App\Models\Seguridad\ConceptoAptitud;
use App\Models\Seguridad\Examen;
use App\Models\Seguridad\EvaluacionMedica;
use App\Models\Seguridad\ExamenEvaluacion;
use App\Models\Seguridad\Recomendacion;
use App\Services\Seguridad\EvaluacionMedicaService;
use App\Services\Seguridad\ExamenPdfExtractorService;
use App\Services\Seguridad\RecomendacionPdfMatcherService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EvaluacionMedicaController extends Controller
{
    public function index(Request $request, EvaluacionMedicaService $service): Response
    {
        $tipoEvaluacion = $request->string('tipo_evaluacion')->toString();
        $estado = $request->string('estado')->toString();
        $verHistorial = $request->boolean('ver_historial');
        $colaboradorTexto = $request->string('colaborador')->toString();
        $identificacion = $request->string('identificacion')->toString();
        $cargo = $request->string('cargo')->toString();
        $centro = $request->string('centro')->toString();
        $colaboradorId = $request->integer('colaborador_id') ?: null;

        $evaluaciones = EvaluacionMedica::query()
            ->with(['colaborador:id,nombres,apellidos,cedula,cargo,centro,area,fecha_ingreso_empresa,is_active', 'conceptoAptitud:id,nombre'])
            ->withCount([
                'examenes as cantidad_requerida_examenes',
                'examenes as cantidad_ejecutada_examenes' => fn ($q) => $q->where('estado', 'realizado'),
            ])
            ->when(! $verHistorial, fn ($q) => $q->whereNotIn('estado', ['terminada', 'ejecutado']))
            ->when($tipoEvaluacion, fn ($q, $v) => $q->where('tipo_evaluacion', $v))
            ->when($estado, fn ($q, $v) => $q->where('estado', $v))
            ->when($colaboradorId, fn ($q, $v) => $q->where('colaborador_id', $v))
            ->when($colaboradorTexto, function ($q, $v) {
                $q->whereHas('colaborador', function ($qq) use ($v) {
                    $qq->where('nombres', 'like', "%{$v}%")->orWhere('apellidos', 'like', "%{$v}%");
                });
            })
            ->when($identificacion, function ($q, $v) {
                $q->whereHas('colaborador', fn ($qq) => $qq->where('cedula', 'like', "%{$v}%"));
            })
            ->when($cargo, function ($q, $v) {
                $q->whereHas('colaborador', fn ($qq) => $qq->where('cargo', $v));
            })
            ->when($centro, function ($q, $v) {
                $q->whereHas('colaborador', fn ($qq) => $qq->where('centro', $v));
            })
            ->latest('fecha_evaluacion')
            ->paginate(15)
            ->withQueryString();

        $evaluaciones->getCollection()->transform(function (EvaluacionMedica $evaluacion) use ($service) {
            foreach ($service->indicadoresBandeja($evaluacion) as $clave => $valor) {
                $evaluacion->setAttribute($clave, $valor);
            }

            return $evaluacion;
        });

        return Inertia::render('seguridad/examenes-medicos/index', [
            'evaluaciones' => $evaluaciones,
            'filtros' => [
                'tipo_evaluacion' => $tipoEvaluacion,
                'estado' => $estado,
                'ver_historial' => $verHistorial,
                'colaborador' => $colaboradorTexto,
                'identificacion' => $identificacion,
                'cargo' => $cargo,
                'centro' => $centro,
            ],
            'catalogos' => [
                'cargos' => config('seguridad.colaboradores.cargos'),
                'centros' => config('seguridad.colaboradores.centros'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('seguridad/examenes-medicos/crear', [
            'colaboradores' => Colaborador::completos()
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'cedula', 'turno', 'cargo']),
        ]);
    }

    public function store(Request $request, EvaluacionMedicaService $service): RedirectResponse
    {
        $data = $request->validate([
            'colaborador_id' => ['required', 'integer', 'exists:colaboradores,id'],
            'tipo_evaluacion' => ['required', Rule::in(['ingreso', 'periodico', 'egreso'])],
        ]);

        $colaborador = Colaborador::findOrFail($data['colaborador_id']);
        $evaluacion = $data['tipo_evaluacion'] === 'egreso'
            ? $service->crearEgreso($colaborador)
            : $service->crear($colaborador, $data['tipo_evaluacion']);

        return to_route('seguridad.examenes-medicos.show', $evaluacion)->with('status', 'Evaluación creada correctamente.');
    }

    public function show(EvaluacionMedica $evaluacion): Response
    {
        if ($evaluacion->tipo_evaluacion === 'egreso') {
            $evaluacion->load('colaborador', 'conceptoAptitud');

            return Inertia::render('seguridad/examenes-medicos/egreso-show', [
                'evaluacion' => $evaluacion,
                'conceptosAptitud' => ConceptoAptitud::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
                'seguimientoOpciones' => config('seguridad.examenes_medicos.egreso.seguimiento_recomendaciones'),
                'empresaDefault' => config('seguridad.examenes_medicos.empresa_default'),
            ]);
        }

        $evaluacion->load([
            'colaborador',
            'conceptoAptitud',
            'examenes.examen',
            'recomendaciones.recomendacion',
            'recomendaciones.seguimientos.responsable:id,first_name,last_name',
        ]);

        return Inertia::render('seguridad/examenes-medicos/show', [
            'evaluacion' => $evaluacion,
            'conceptosAptitud' => ConceptoAptitud::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
            'examenesCatalogo' => Examen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
            'recomendacionesCatalogo' => Recomendacion::where('activo', true)->orderBy('categoria')->orderBy('nombre')->get(['id', 'nombre', 'categoria']),
            'categoriasRecomendacion' => config('seguridad.examenes_medicos.recomendaciones.categorias'),
            'estadosSeguimiento' => config('seguridad.examenes_medicos.recomendaciones.estados_seguimiento'),
            'seguimientoOpciones' => config('seguridad.examenes_medicos.egreso.seguimiento_recomendaciones'),
            'empresaDefault' => config('seguridad.examenes_medicos.empresa_default'),
        ]);
    }

    public function programarExamen(
        Request $request,
        EvaluacionMedica $evaluacion,
        ExamenEvaluacion $examenEvaluacion,
        EvaluacionMedicaService $service,
    ): RedirectResponse {
        $data = $request->validate(['fecha_programacion' => ['required', 'date']]);

        $examenEvaluacion->update([...$data, 'estado' => 'programado']);
        $service->recalcularEstado($evaluacion);

        return back()->with('status', 'Examen programado.');
    }

    public function ejecutarExamen(
        Request $request,
        EvaluacionMedica $evaluacion,
        ExamenEvaluacion $examenEvaluacion,
        EvaluacionMedicaService $service,
        ExamenPdfExtractorService $extractor,
        RecomendacionPdfMatcherService $matcher,
    ): RedirectResponse {
        $data = $request->validate([
            'fecha_ejecucion' => ['required', 'date'],
            'soporte' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:5120'],
            'observacion' => ['nullable', 'string', 'max:2000'],
        ]);

        $soportePath = $examenEvaluacion->soporte_path;
        $camposPdf = [];

        if ($request->hasFile('soporte')) {
            $archivo = $request->file('soporte');

            // HU-033: si es PDF, se extrae texto ANTES de moverlo a storage
            // (una vez movido, la ruta temporal original ya no es válida).
            if (strtolower((string) $archivo->getClientOriginalExtension()) === 'pdf') {
                $texto = $extractor->extraerTexto($archivo->getRealPath());

                if ($texto !== '') {
                    $camposPdf = $extractor->extraerCamposIngreso($texto);
                    $matcher->marcarCoincidencias($evaluacion, $texto);
                }
            }

            $soportePath = $archivo->store('examenes-medicos', 'public');
        }

        $examenEvaluacion->update([
            'fecha_ejecucion' => $data['fecha_ejecucion'],
            'observacion' => $data['observacion'] ?? $examenEvaluacion->observacion,
            'soporte_path' => $soportePath,
            'estado' => 'realizado',
            ...$camposPdf,
        ]);

        $service->recalcularEstado($evaluacion);

        return back()->with('status', 'Ejecución del examen registrada.');
    }

    public function agregarExamenAdicional(Request $request, EvaluacionMedica $evaluacion, EvaluacionMedicaService $service): RedirectResponse
    {
        $data = $request->validate([
            'examen_id' => [
                'required', 'integer', 'exists:examenes,id',
                Rule::unique('examenes_evaluacion', 'examen_id')->where('evaluacion_medica_id', $evaluacion->id),
            ],
        ]);

        $evaluacion->examenes()->create([
            'examen_id' => $data['examen_id'],
            'obligatorio' => false,
            'origen' => 'adicional',
            'estado' => 'pendiente',
        ]);

        $service->recalcularEstado($evaluacion);

        return back()->with('status', 'Examen adicional agregado.');
    }

    public function actualizarConceptoAptitud(Request $request, EvaluacionMedica $evaluacion, EvaluacionMedicaService $service): RedirectResponse
    {
        $opciones = config('seguridad.examenes_medicos.egreso.seguimiento_recomendaciones');
        $requiereDetalle = $request->input('seguimiento_recomendaciones') === 'Soporte desestimiento u otro';

        $data = $request->validate([
            'concepto_aptitud_id' => ['nullable', 'integer', 'exists:conceptos_aptitud,id'],
            'emite' => ['nullable', 'string', 'max:255'],
            'observacion' => ['nullable', 'string', 'max:2000'],
            // HU-033 CA-033.5/.6/.7/.8: seguimiento del examen — aplica a
            // cualquier tipo_evaluacion, no solo egreso (se reutilizan las
            // columnas seguimiento_recomendaciones/detalle ya existentes
            // como el "catálogo de cartas + Otro").
            'seguimiento_recomendaciones' => ['nullable', Rule::in($opciones)],
            'seguimiento_recomendaciones_detalle' => [Rule::requiredIf($requiereDetalle), 'nullable', 'string', 'max:2000'],
            'estado_seguimiento' => ['nullable', Rule::in(['Completo', 'Incompleto'])],
            'empresa' => ['nullable', 'string', 'max:255'],
            'carta_entregada' => ['nullable', 'boolean'],
            'carta_entregada_observacion' => ['nullable', 'string', 'max:2000'],
        ]);

        if (array_key_exists('empresa', $data) && ($data['empresa'] ?? '') === '') {
            $data['empresa'] = config('seguridad.examenes_medicos.empresa_default');
        }

        $evaluacion->update($data);

        // Egreso no tiene matriz de exámenes: recalcularEstado() asume
        // exámenes obligatorios y lo dejaría mal (sin_iniciar) — no aplica.
        if ($evaluacion->tipo_evaluacion !== 'egreso') {
            $service->recalcularEstado($evaluacion);
        }

        return back()->with('status', 'Concepto de aptitud actualizado.');
    }

    public function programarEgreso(Request $request, EvaluacionMedica $evaluacion, EvaluacionMedicaService $service): RedirectResponse
    {
        $data = $request->validate(['fecha_programacion' => ['required', 'date']]);

        $evaluacion->update($data);
        $service->recalcularEstadoEgreso($evaluacion);

        return back()->with('status', 'Examen de egreso programado.');
    }

    public function ejecutarEgreso(Request $request, EvaluacionMedica $evaluacion, EvaluacionMedicaService $service): RedirectResponse
    {
        $data = $request->validate([
            'fecha_examen_ejecutado' => ['required', 'date'],
            'soporte' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:5120'],
        ]);

        $soportePath = $evaluacion->soporte_path;

        if ($request->hasFile('soporte')) {
            $soportePath = $request->file('soporte')->store('examenes-medicos', 'public');
        }

        $evaluacion->update([
            'fecha_examen_ejecutado' => $data['fecha_examen_ejecutado'],
            'soporte_path' => $soportePath,
        ]);
        $service->recalcularEstadoEgreso($evaluacion);

        return back()->with('status', 'Ejecución del examen de egreso registrada.');
    }

    public function rechazarEgreso(Request $request, EvaluacionMedica $evaluacion, EvaluacionMedicaService $service): RedirectResponse
    {
        $data = $request->validate(['observacion_rechazo' => ['required', 'string', 'max:2000']]);

        $service->rechazarEgreso($evaluacion, $data['observacion_rechazo']);

        return back()->with('status', 'Rechazo del examen de egreso registrado.');
    }

    public function actualizarSeguimientoEgreso(Request $request, EvaluacionMedica $evaluacion): RedirectResponse
    {
        $opciones = config('seguridad.examenes_medicos.egreso.seguimiento_recomendaciones');
        $requiereDetalle = $request->input('seguimiento_recomendaciones') === 'Soporte desestimiento u otro';

        $data = $request->validate([
            'seguimiento_recomendaciones' => ['required', Rule::in($opciones)],
            'seguimiento_recomendaciones_detalle' => [Rule::requiredIf($requiereDetalle), 'nullable', 'string', 'max:2000'],
        ]);

        $evaluacion->update($data);

        return back()->with('status', 'Seguimiento a recomendaciones actualizado.');
    }
}
