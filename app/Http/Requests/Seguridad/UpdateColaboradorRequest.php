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
            'is_active' => ['boolean'],
        ];
    }
}
