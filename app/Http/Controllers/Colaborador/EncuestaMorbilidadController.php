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
                'nombre_completo'   => $colaborador->nombre_completo,
                'cedula'            => $colaborador->cedula,
                'area'              => $colaborador->area,
                'cargo'             => $colaborador->cargo,
                'correo'            => $colaborador->correo,
                'edad'              => $colaborador->edad,
                'estado_civil'      => $colaborador->estado_civil,
                'ciudad_residencia' => $colaborador->ciudad_residencia,
                'estrato'           => $colaborador->estrato,
                'turno'             => $colaborador->turno,
                'tipo_contrato'     => $colaborador->tipo_contrato,
            ],
            'fechaHora'  => $encuesta->fecha_hora,
            'secciones'  => config('morbilidad.secciones'),
            'respuestas' => $this->respuestasIndexadas($encuesta),
            // Datos del paso 1 ya guardados (para reanudar borrador)
            'paso1' => [
                'empresa'                => $encuesta->empresa,
                'correo_electronico'     => $encuesta->correo_electronico,
                'edad'                   => $encuesta->edad,
                'estado_civil'           => $encuesta->estado_civil,
                'tiene_hijos'            => $encuesta->tiene_hijos,
                'hijos'                  => $encuesta->hijos ?? [],
                'personas_a_cargo'       => $encuesta->personas_a_cargo,
                'personas_cargo_detalle' => $encuesta->personas_cargo_detalle ?? [],
                'nivel_escolaridad'      => $encuesta->nivel_escolaridad,
                'estrato_socioeconomico' => $encuesta->estrato_socioeconomico,
                'tenencia_vivienda'      => $encuesta->tenencia_vivienda,
                'ciudad_residencia'      => $encuesta->ciudad_residencia,
                'direccion_residencia'   => $encuesta->direccion_residencia,
                'tipo_contratacion'      => $encuesta->tipo_contratacion,
                'cargo_paso1'            => $encuesta->cargo_paso1,
                'area_paso1'             => $encuesta->area_paso1,
                'antiguedad_empresa'     => $encuesta->antiguedad_empresa,
                'antiguedad_cargo'       => $encuesta->antiguedad_cargo,
                'duracion_contrato'      => $encuesta->duracion_contrato,
                'turno'                  => $encuesta->turno,
                'promedio_ingresos'      => $encuesta->promedio_ingresos,
            ],
        ]);
    }

    public function guardar(Request $request, EncuestaMorbilidad $encuestaMorbilidad): RedirectResponse
    {
        $colaborador = $this->colaboradorDeOFallar($request);
        $this->autorizarPropiaYBorrador($encuestaMorbilidad, $colaborador);

        $catalogo = (new MorbilidadCatalogoService())->preguntasPlanas();

        $data = $request->validate([
            // ── Respuestas de secciones 2-10 ─────────────────────────────
            'respuestas'                          => ['present', 'array'],
            'respuestas.*.numero'                 => ['required', 'integer', Rule::in(array_keys($catalogo))],
            'respuestas.*.valor'                  => ['nullable', 'string'],
            'respuestas.*.detalle'                => ['nullable', 'string'],
            // ── Campos del Paso 1 (guardado parcial, sin obligatoriedad) ──
            'paso1'                               => ['nullable', 'array'],
            'paso1.empresa'                       => ['nullable', 'string', 'max:50'],
            'paso1.correo_electronico'            => ['nullable', 'email', 'max:120'],
            'paso1.edad'                          => ['nullable', 'integer', 'min:14', 'max:100'],
            'paso1.estado_civil'                  => ['nullable', 'string', 'max:50'],
            'paso1.tiene_hijos'                   => ['nullable', 'string', 'in:Si,No'],
            'paso1.hijos'                         => ['nullable', 'array'],
            'paso1.hijos.*.nombre'                => ['nullable', 'string', 'max:80'],
            'paso1.hijos.*.edad'                  => ['nullable', 'integer', 'min:0'],
            'paso1.personas_a_cargo'              => ['nullable', 'string', 'in:Si,No'],
            'paso1.personas_cargo_detalle'        => ['nullable', 'array'],
            'paso1.personas_cargo_detalle.*.tipo' => ['nullable', 'string', 'max:30'],
            'paso1.personas_cargo_detalle.*.edad' => ['nullable', 'integer', 'min:0'],
            'paso1.nivel_escolaridad'             => ['nullable', 'string', 'max:60'],
            'paso1.estrato_socioeconomico'        => ['nullable', 'string', 'max:40'],
            'paso1.tenencia_vivienda'             => ['nullable', 'string', 'max:60'],
            'paso1.ciudad_residencia'             => ['nullable', 'string', 'max:100'],
            'paso1.direccion_residencia'          => ['nullable', 'string', 'max:200'],
            'paso1.tipo_contratacion'             => ['nullable', 'string', 'max:80'],
            'paso1.cargo_paso1'                   => ['nullable', 'string', 'max:100'],
            'paso1.area_paso1'                    => ['nullable', 'string', 'max:100'],
            'paso1.antiguedad_empresa'            => ['nullable', 'string', 'max:40'],
            'paso1.antiguedad_cargo'              => ['nullable', 'string', 'max:40'],
            'paso1.duracion_contrato'             => ['nullable', 'string', 'max:40'],
            'paso1.turno'                         => ['nullable', 'string', 'max:20'],
            'paso1.promedio_ingresos'             => ['nullable', 'string', 'max:60'],
        ]);

        // Guardar campos del paso 1 si vienen en el payload
        if (!empty($data['paso1'])) {
            $encuestaMorbilidad->update($data['paso1']);
        }

        $this->guardarRespuestas($encuestaMorbilidad, $data['respuestas']);

        return back()->with('status', 'Progreso guardado.');
    }

    public function store(EnviarEncuestaMorbilidadRequest $request, EncuestaMorbilidad $encuestaMorbilidad): RedirectResponse
    {
        // Guardar campos del paso 1
        if ($request->has('paso1')) {
            $encuestaMorbilidad->update($request->input('paso1'));
        }

        $this->guardarRespuestas($encuestaMorbilidad, $request->input('respuestas', []));

        $encuestaMorbilidad->update([
            'estado'     => EncuestaMorbilidad::ESTADO_COMPLETADA,
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
