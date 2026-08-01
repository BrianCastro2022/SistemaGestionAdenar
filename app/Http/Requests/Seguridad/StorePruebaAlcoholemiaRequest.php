<?php

namespace App\Http\Requests\Seguridad;

use App\Models\Seguridad\Alcoholimetro;
use App\Models\Seguridad\PruebaAlcoholemia;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePruebaAlcoholemiaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'colaborador_id' => ['required', 'integer', Rule::exists('colaboradores', 'id')->whereNull('deleted_at')],
            'tipo' => ['required', Rule::in(['entrada', 'ruta', 'salida'])],
            'es_programacion' => ['boolean'],
            'programada_en' => ['required_if:es_programacion,1', 'nullable', 'date', 'after:now'],
            'alcoholimetro_id' => [
                'required_unless:es_programacion,1', 'nullable', 'integer',
                Rule::exists('alcoholimetros', 'id')->where('estado', 'Disponible'),
            ],
            'resultado' => ['required_unless:es_programacion,1', 'nullable', 'numeric'],
            'consentimiento_aceptado' => ['required_unless:es_programacion,1', 'accepted'],
            'evidencia' => ['nullable', 'image', 'max:5120'],
            'evidencias' => ['nullable', 'array'],
            'evidencias.*' => ['image', 'max:5120'],
            'firma' => ['nullable', 'image', 'max:2048'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->boolean('es_programacion') || ! $this->filled(['alcoholimetro_id', 'resultado'])) {
                return;
            }

            $alcoholimetro = Alcoholimetro::find($this->input('alcoholimetro_id'));

            if ($alcoholimetro && (
                (float) $this->input('resultado') < (float) $alcoholimetro->valor_min
                || (float) $this->input('resultado') > (float) $alcoholimetro->valor_max
            )) {
                $validator->errors()->add(
                    'resultado',
                    "El resultado debe estar entre {$alcoholimetro->valor_min} y {$alcoholimetro->valor_max} para este dispositivo."
                );
            }

            $fechaHora = Carbon::now();
            $horas = (int) config('seguridad.intervalo_minimo_horas');

            if (PruebaAlcoholemia::existeConflictoDeIntervalo((int) $this->input('colaborador_id'), $this->input('tipo'), $fechaHora)) {
                $validator->errors()->add(
                    'tipo',
                    "Este colaborador ya tiene una prueba de tipo \"{$this->input('tipo')}\" registrada en las últimas {$horas} horas."
                );
            }
        });
    }
}
