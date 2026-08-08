<?php

namespace App\Http\Requests\Seguridad;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateColaboradorPaso3Request extends FormRequest
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
            'area' => ['nullable', Rule::in(['Administrativa', 'Operativa'])],
            'cargo' => ['nullable', Rule::in(config('seguridad.colaboradores.cargos'))],
            // Fecha en la que inicia el cargo seleccionado; requerida cuando
            // se envía un cargo, para poder abrir el registro de historial.
            'cargo_fecha_inicio' => ['nullable', 'required_with:cargo', 'date'],

            'centro' => ['nullable', Rule::in(config('seguridad.colaboradores.centros'))],
            'centro_trabajo' => ['nullable', Rule::in(config('seguridad.colaboradores.centros_trabajo'))],
            'fecha_ingreso_empresa' => ['nullable', 'date'],
            'fecha_retiro_empresa' => ['nullable', 'date', 'after_or_equal:today'],
            'motivo_retiro' => ['nullable', Rule::in(config('seguridad.colaboradores.motivos_retiro'))],
            'tipo_contrato' => ['nullable', Rule::in(config('seguridad.colaboradores.tipos_contrato'))],
            'contrato_fecha_desde' => ['nullable', 'date'],
            'contrato_fecha_hasta' => ['nullable', 'date', 'after_or_equal:contrato_fecha_desde', 'after_or_equal:today'],

            'codigo_qr_skap' => ['nullable', 'string', 'max:100'],

            'vacaciones_aplica' => ['nullable', Rule::in(['no_aplica', 'aplica'])],
            'vacaciones_fecha_desde' => ['nullable', 'date', 'after_or_equal:today'],
            'vacaciones_fecha_hasta' => ['nullable', 'date', 'after_or_equal:vacaciones_fecha_desde', 'after_or_equal:today'],
            'vacaciones_pagadas_fecha_desde' => ['nullable', 'date', 'after_or_equal:today'],
            'vacaciones_pagadas_fecha_hasta' => ['nullable', 'date', 'after_or_equal:vacaciones_pagadas_fecha_desde', 'after_or_equal:today'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $colaborador = $this->route('colaborador');
            $cargoFechaInicio = $this->input('cargo_fecha_inicio');

            if (! $colaborador || ! $this->input('cargo') || ! $cargoFechaInicio) {
                return;
            }

            $cargoActivo = $colaborador->cargoActual;

            if ($cargoActivo && $cargoActivo->cargo !== $this->input('cargo')
                && $cargoFechaInicio < $cargoActivo->fecha_inicio->toDateString()) {
                $validator->errors()->add(
                    'cargo_fecha_inicio',
                    'La fecha de inicio del nuevo cargo no puede ser anterior a la fecha de inicio del cargo actual.'
                );
            }
        });
    }
}
