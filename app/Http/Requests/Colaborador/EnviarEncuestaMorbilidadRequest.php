<?php

namespace App\Http\Requests\Colaborador;

use App\Models\Seguridad\EncuestaMorbilidad;
use App\Services\Colaborador\MorbilidadCatalogoService;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Envío final de la encuesta (HU-01 a HU-10). A diferencia de "guardar
 * borrador" (que acepta respuestas parciales/incompletas), aquí se exige
 * que toda pregunta obligatoria del catálogo tenga una respuesta válida —
 * y, cuando el tipo lo pida, su "detalle" — antes de marcar la encuesta
 * como `completada`.
 */
class EnviarEncuestaMorbilidadRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var EncuestaMorbilidad $encuesta */
        $encuesta = $this->route('encuestaMorbilidad');
        $colaborador = $this->user()->colaborador;

        return $colaborador
            && $encuesta->colaborador_id === $colaborador->id
            && $encuesta->estado === EncuestaMorbilidad::ESTADO_BORRADOR;
    }

    public function rules(): array
    {
        return [
            'respuestas' => ['present', 'array'],
            'respuestas.*.numero' => ['required', 'integer'],
            'respuestas.*.valor' => ['nullable', 'string'],
            'respuestas.*.detalle' => ['nullable', 'string'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $catalogo = new MorbilidadCatalogoService();
            $planas = $catalogo->preguntasPlanas();

            $respuestasPorNumero = collect($this->input('respuestas', []))
                ->keyBy(fn ($respuesta) => (int) ($respuesta['numero'] ?? 0));

            foreach ($planas as $numero => $pregunta) {
                $respuesta = $respuestasPorNumero->get($numero);
                $valor = $respuesta['valor'] ?? null;
                $detalle = trim((string) ($respuesta['detalle'] ?? ''));

                // RN-03/RN-04/RN-05: "No aplica" es el valor por defecto de
                // las preguntas `aplica_detalle` — si no llegó respuesta
                // para una de estas, no se exige explícitamente (el
                // frontend ya la envía marcada, pero esto evita que un
                // cliente distinto, o un bug de inicialización, bloquee el
                // envío por algo que visualmente ya está respondido).
                if ($pregunta['tipo'] === 'aplica_detalle' && ! $respuesta) {
                    $valor = 'No aplica';
                }

                if ($pregunta['obligatorio']) {
                    $permitidos = $catalogo->valoresPermitidosPorTipo($pregunta['tipo']);

                    if (! in_array($valor, $permitidos, true)) {
                        $validator->errors()->add("respuestas.{$numero}.valor", 'Debes responder esta pregunta.');

                        continue;
                    }
                }

                $requiereDetalle = ($pregunta['tipo'] === 'si_no_detalle' && $valor === 'Si')
                    || ($pregunta['tipo'] === 'aplica_detalle' && $valor === 'Aplica');

                if ($requiereDetalle && $detalle === '') {
                    $validator->errors()->add("respuestas.{$numero}.detalle", 'Por favor especifica más detalle.');
                }
            }
        });
    }
}
