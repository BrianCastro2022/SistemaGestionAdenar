<?php

namespace App\Http\Requests\Seguridad;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateColaboradorRequest extends FormRequest
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
            'cedula' => [
                'required', 'string', 'max:30',
                Rule::unique('colaboradores', 'cedula')->ignore($this->route('colaborador'))->whereNull('deleted_at'),
            ],
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'cargo' => ['nullable', 'string', 'max:100'],
            'turno' => ['nullable', Rule::in(['manana', 'tarde', 'noche'])],
            'area' => ['nullable', 'string', 'max:100'],
            'imagen' => ['nullable', 'image', 'max:2048'],
            'documento_cedula' => ['nullable', 'array'],
            'documento_cedula.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'documento_licencia_conduccion' => ['nullable', 'array'],
            'documento_licencia_conduccion.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'documento_carnet_manejo_defensivo' => ['nullable', 'array'],
            'documento_carnet_manejo_defensivo.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'documento_certificado_manejo_defensivo' => ['nullable', 'array'],
            'documento_certificado_manejo_defensivo.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'documento_carnet_ingreso_cd' => ['nullable', 'array'],
            'documento_carnet_ingreso_cd.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'documento_simit' => ['nullable', 'array'],
            'documento_simit.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'documento_examen_medico_ocupacional' => ['nullable', 'array'],
            'documento_examen_medico_ocupacional.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'documento_recordatorio_vehiculo_licencia_conduccion' => ['nullable', 'array'],
            'documento_recordatorio_vehiculo_licencia_conduccion.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'is_active' => ['boolean'],
        ];
    }
}
