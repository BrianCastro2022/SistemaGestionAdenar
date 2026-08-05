<?php

namespace App\Http\Requests\Seguridad;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreColaboradorRequest extends FormRequest
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
            'cedula' => ['required', 'string', 'max:30', Rule::unique('colaboradores', 'cedula')],
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'cargo' => ['nullable', 'string', 'max:100'],
            'turno' => ['nullable', Rule::in(['manana', 'tarde', 'noche'])],
            'area' => ['nullable', 'string', 'max:100'],
            'expedido_en' => ['nullable', 'string', 'max:100'],
            'sexo' => ['nullable', Rule::in(['femenino', 'masculino'])],
            'fecha_nacimiento' => ['nullable', 'date'],
            'ciudad_residencia' => ['nullable', 'string', 'max:100'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'estrato' => ['nullable', Rule::in(['1', '2', '3', '4', '5', '6'])],
            'celular_1' => ['nullable', 'string', 'max:30'],
            'celular_2' => ['nullable', 'string', 'max:30'],
            'correo' => ['nullable', 'email', 'max:255'],
            'estado_civil' => ['nullable', Rule::in(['soltero', 'union_libre', 'casado', 'divorciado', 'viudo'])],
            'discapacidad' => ['nullable', Rule::in(['no_aplica', 'aplica'])],
            'victima_conflicto' => ['nullable', Rule::in(['si', 'no'])],
            'libreta_militar' => ['nullable', Rule::in(['no_aplica', 'aplica'])],
            'ha_trabajado_antes' => ['nullable', Rule::in(['si', 'no'])],
            'cargo_anterior' => ['nullable', 'string', 'max:100'],
            'fecha_ultima_laboral' => ['nullable', 'date'],
            'tiene_experiencia' => ['nullable', Rule::in(['si', 'no'])],
            'area_experiencia' => ['nullable', 'string', 'max:100'],
            'cargo_experiencia' => ['nullable', 'string', 'max:100'],
            'anios_experiencia' => ['nullable', 'integer', 'min:0', 'max:100'],
            'codigo_qr_skap' => ['nullable', 'string', 'max:100'],
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
            'documento_eps' => ['nullable', 'array'],
            'documento_eps.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'documento_pension' => ['nullable', 'array'],
            'documento_pension.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'documento_titulo_bachiller' => ['nullable', 'array'],
            'documento_titulo_bachiller.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'documento_titulo_academico' => ['nullable', 'array'],
            'documento_titulo_academico.*' => ['file', 'mimes:pdf,xls,xlsx', 'max:5120'],
            'is_active' => ['boolean'],
        ];
    }
}
