<?php

namespace App\Http\Controllers\Colaborador;

use App\Http\Controllers\Controller;
use App\Http\Requests\Colaborador\EnviarEncuestaMorbilidadRequest;
use App\Models\Seguridad\Colaborador;
use App\Models\Seguridad\EncuestaMorbilidad;
use App\Services\Colaborador\MorbilidadCatalogoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EncuestaMorbilidadController extends Controller
{
    public function create(Request $request): Response
    {
        $colaborador = $this->colaboradorDeOFallar($request);

        // Retoma el borrador abierto más reciente (HU general CA-01:
        // "conserva un borrador para continuar posteriormente"), o abre uno
        // nuevo — no se bloquea iniciar una encuesta nueva si la anterior ya
        // quedó `completada`.
        $encuesta = EncuestaMorbilidad::where('colaborador_id', $colaborador->id)
            ->where('estado', EncuestaMorbilidad::ESTADO_BORRADOR)
            ->latest('id')
            ->first();

        if (! $encuesta) {
            $encuesta = EncuestaMorbilidad::create([
                'colaborador_id' => $colaborador->id,
                'estado' => EncuestaMorbilidad::ESTADO_BORRADOR,
                'fecha_hora' => now(),
            ]);
        }

        return Inertia::render('colaborador/encuesta-morbilidad/index', [
            'encuestaId' => $encuesta->id,
            'colaborador' => [
                'nombre_completo' => $colaborador->nombre_completo,
                'cedula' => $colaborador->cedula,
                'area' => $colaborador->area,
                'cargo' => $colaborador->cargo,
            ],
            'fechaHora' => $encuesta->fecha_hora,
            'secciones' => config('morbilidad.secciones'),
            'respuestas' => $this->respuestasIndexadas($encuesta),
        ]);
    }

    public function guardar(Request $request, EncuestaMorbilidad $encuestaMorbilidad): RedirectResponse
    {
        $colaborador = $this->colaboradorDeOFallar($request);
        $this->autorizarPropiaYBorrador($encuestaMorbilidad, $colaborador);

        $catalogo = (new MorbilidadCatalogoService())->preguntasPlanas();

        $data = $request->validate([
            'respuestas' => ['present', 'array'],
            'respuestas.*.numero' => ['required', 'integer', Rule::in(array_keys($catalogo))],
            'respuestas.*.valor' => ['nullable', 'string'],
            'respuestas.*.detalle' => ['nullable', 'string'],
        ]);

        $this->guardarRespuestas($encuestaMorbilidad, $data['respuestas']);

        return back()->with('status', 'Progreso guardado.');
    }

    public function store(EnviarEncuestaMorbilidadRequest $request, EncuestaMorbilidad $encuestaMorbilidad): RedirectResponse
    {
        $this->guardarRespuestas($encuestaMorbilidad, $request->input('respuestas', []));

        $encuestaMorbilidad->update([
            'estado' => EncuestaMorbilidad::ESTADO_COMPLETADA,
            'enviado_en' => now(),
        ]);

        return to_route('portal.encuesta-morbilidad.historial')
            ->with('status', 'Encuesta enviada correctamente. ¡Gracias por completarla!');
    }

    public function historial(Request $request): Response
    {
        $colaborador = $this->colaboradorDeOFallar($request);

        $encuestas = EncuestaMorbilidad::where('colaborador_id', $colaborador->id)
            ->latest('fecha_hora')
            ->paginate(15);

        return Inertia::render('colaborador/encuesta-morbilidad/historial', [
            'encuestas' => $encuestas,
        ]);
    }

    public function show(Request $request, EncuestaMorbilidad $encuestaMorbilidad): Response
    {
        $colaborador = $this->colaboradorDeOFallar($request);
        $this->autorizarPropia($encuestaMorbilidad, $colaborador);

        return Inertia::render('colaborador/encuesta-morbilidad/show', [
            'encuesta' => [
                'id' => $encuestaMorbilidad->id,
                'estado' => $encuestaMorbilidad->estado,
                'fecha_hora' => $encuestaMorbilidad->fecha_hora,
                'enviado_en' => $encuestaMorbilidad->enviado_en,
            ],
            'colaborador' => [
                'nombre_completo' => $colaborador->nombre_completo,
                'cedula' => $colaborador->cedula,
                'area' => $colaborador->area,
                'cargo' => $colaborador->cargo,
            ],
            'secciones' => config('morbilidad.secciones'),
            'respuestas' => $this->respuestasIndexadas($encuestaMorbilidad),
        ]);
    }

    /**
     * @param  array<int, array{numero: int, valor: ?string, detalle: ?string}>  $respuestas
     */
    private function guardarRespuestas(EncuestaMorbilidad $encuestaMorbilidad, array $respuestas): void
    {
        foreach ($respuestas as $respuesta) {
            $encuestaMorbilidad->respuestas()->updateOrCreate(
                ['numero_pregunta' => $respuesta['numero']],
                ['valor' => $respuesta['valor'] ?? null, 'detalle' => $respuesta['detalle'] ?? null],
            );
        }
    }

    /**
     * @return \Illuminate\Support\Collection<int, array{valor: ?string, detalle: ?string}>
     */
    private function respuestasIndexadas(EncuestaMorbilidad $encuestaMorbilidad)
    {
        return $encuestaMorbilidad->respuestas()->get()
            ->keyBy('numero_pregunta')
            ->map(fn ($respuesta) => ['valor' => $respuesta->valor, 'detalle' => $respuesta->detalle]);
    }

    private function autorizarPropia(EncuestaMorbilidad $encuestaMorbilidad, Colaborador $colaborador): void
    {
        abort_unless($encuestaMorbilidad->colaborador_id === $colaborador->id, 403);
    }

    private function autorizarPropiaYBorrador(EncuestaMorbilidad $encuestaMorbilidad, Colaborador $colaborador): void
    {
        $this->autorizarPropia($encuestaMorbilidad, $colaborador);
        abort_unless($encuestaMorbilidad->estado === EncuestaMorbilidad::ESTADO_BORRADOR, 403);
    }

    private function colaboradorDeOFallar(Request $request): Colaborador
    {
        return $request->user()->colaborador ?? abort(
            403,
            'Tu cuenta todavía no está vinculada a un registro de colaborador. Contacta a un administrador.'
        );
    }
}
