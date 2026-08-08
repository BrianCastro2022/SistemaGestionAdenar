<?php

namespace App\Http\Requests\Seguridad;

use Illuminate\Foundation\Http\FormRequest;

class StoreLlamadoAtencionRequest extends FormRequest
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
            'observacion' => ['required', 'string', 'max:2000'],
            'documento' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,xls,xlsx', 'max:5120'],
        ];
    }
}
