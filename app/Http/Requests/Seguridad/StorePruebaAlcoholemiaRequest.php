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
        $pruebaActual = $this->route('prueba');
        $alcoholimetroActualId = $pruebaActual?->alcoholimetro_id;

        return [
            'colaborador_id' => ['required', 'integer', Rule::exists('colaboradores', 'id')->whereNull('deleted_at')],
            'tipo' => ['required', Rule::in(['entrada', 'ruta', 'salida'])],
            'es_programacion' => ['boolean'],
            'programada_en' => [
                'required_if:es_programacion,1', 'nullable', 'date',
                function ($attribute, $value, $fail) use ($pruebaActual) {
                    if (! $value) {
                        return;
                    }

                    $sinCambios = $pruebaActual?->programada_en && Carbon::parse($value)->equalTo($pruebaActual->programada_en);

                    if (! $sinCambios && Carbon::parse($value)->isPast()) {
                        $fail('La fecha programada debe ser posterior al momento actual.');
                    }
                },
            ],
            'alcoholimetro_id' => [
                'required_unless:es_programacion,1', 'nullable', 'integer',
                Rule::exists('alcoholimetros', 'id')->where(function ($query) use ($alcoholimetroActualId) {
                    $query->where('estado', 'Disponible');

                    if ($alcoholimetroActualId) {
                        $query->orWhere('id', $alcoholimetroActualId);
                    }
                }),
            ],
            'resultado' => ['required_unless:es_programacion,1', 'nullable', 'numeric'],
            'consentimiento_aceptado' => ['required_unless:es_programacion,1', 'accepted'],
            'evidencia' => ['nullable', 'array'],
            'evidencia.*' => ['image', 'max:5120'],
            'evidencias' => ['nullable', 'array'],
            'evidencias.*' => ['image', 'max:5120'],
            'firma' => ['nullable', 'image', 'max:2048'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
            'condiciones_salud_habilitadas' => ['boolean'],
            'estado_ingreso' => ['nullable', Rule::in(['Bueno', 'Regular', 'Malo'])],
            'observacion_entrada' => ['nullable', 'string', 'max:2000'],
            'estado_salida' => ['nullable', Rule::in(['Bueno', 'Regular', 'Malo'])],
            'observacion_salida' => ['nullable', 'string', 'max:2000'],
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

            $prueba = $this->route('prueba');
            $fechaHora = $prueba?->fecha_hora ?? Carbon::now();
            $horas = (int) config('seguridad.intervalo_minimo_horas');
            $ignorarId = $this->route('prueba')?->id;

            if (PruebaAlcoholemia::existeConflictoDeIntervalo((int) $this->input('colaborador_id'), $this->input('tipo'), $fechaHora, $ignorarId)) {
                $validator->errors()->add(
                    'tipo',
                    "Este colaborador ya tiene una prueba de tipo \"{$this->input('tipo')}\" registrada en las últimas {$horas} horas."
                );
            }

            // Validar condiciones de salud si están habilitadas
            if ($this->boolean('condiciones_salud_habilitadas')) {
                $tipo = $this->input('tipo');

                if ($tipo === 'entrada') {
                    if (! $this->filled('estado_ingreso')) {
                        $validator->errors()->add('estado_ingreso', 'El estado al ingreso es requerido.');
                    }
                    if ($this->input('estado_ingreso') !== 'Bueno' && ! $this->filled('observacion_entrada')) {
                        $validator->errors()->add('observacion_entrada', 'La observación es requerida para estados Regular o Malo.');
                    }
                } elseif ($tipo === 'salida') {
                    if (! $this->filled('estado_salida')) {
                        $validator->errors()->add('estado_salida', 'El estado a la salida es requerido.');
                    }
                    if ($this->input('estado_salida') !== 'Bueno' && ! $this->filled('observacion_salida')) {
                        $validator->errors()->add('observacion_salida', 'La observación es requerida para estados Regular o Malo.');
                    }
                }
            }
        });
    }
}
