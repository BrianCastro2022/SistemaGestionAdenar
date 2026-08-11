<?php

namespace App\Http\Requests\Seguridad\Concerns;

trait ValidatesColaboradorDocumentos
{
    /**
     * Formatos aceptados para los documentos del colaborador: PDF, Word e
     * imágenes. Se comparte con StoreLlamadoAtencionRequest para que todos
     * los documentos del colaborador acepten exactamente lo mismo.
     */
    public const MIMES = 'pdf,doc,docx,jpg,jpeg,png';

    /**
     * Reglas repetidas para un grupo de campos de documentos multi-archivo
     * (`nullable array` + cada archivo como pdf/word/imagen hasta 5MB).
     *
     * @param  array<int, string>  $campos
     * @return array<string, mixed>
     */
    protected function documentoRules(array $campos): array
    {
        $rules = [];

        foreach ($campos as $campo) {
            $rules[$campo] = ['nullable', 'array'];
            $rules["{$campo}.*"] = ['file', 'mimes:'.self::MIMES, 'max:5120'];
        }

        return $rules;
    }
}
