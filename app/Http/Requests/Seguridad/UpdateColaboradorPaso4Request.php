<?php

namespace App\Http\Requests\Seguridad;

use App\Http\Requests\Seguridad\Concerns\ValidatesColaboradorDocumentos;
use App\Support\Seguridad\ColaboradorDocumentoCampos;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateColaboradorPaso4Request extends FormRequest
{
    use ValidatesColaboradorDocumentos;

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
            'licencia_conduccion_categorias' => ['nullable', 'array'],
            'licencia_conduccion_categorias.*' => [Rule::in(config('seguridad.colaboradores.licencia_conduccion_categorias'))],

            'es_padrino' => ['nullable', Rule::in(['no_aplica', 'aplica'])],
            'tipo_padrino' => ['nullable', 'required_if:es_padrino,aplica', Rule::in(['padrino', 'plan_padrino_personal_nuevo'])],

            ...$this->documentoRules(ColaboradorDocumentoCampos::PASO4),
        ];
    }
}
