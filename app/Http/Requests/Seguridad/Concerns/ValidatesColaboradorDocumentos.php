<?php

namespace App\Http\Requests\Seguridad\Concerns;

trait ValidatesColaboradorDocumentos
{
    /**
     * Reglas repetidas para un grupo de campos de documentos multi-archivo
     * (`nullable array` + cada archivo como pdf/xls/xlsx hasta 5MB).
     *
     * @param  array<int, string>  $campos
     * @return array<string, mixed>
     */
    protected function documentoRules(array $campos): array
    {
        $rules = [];

        foreach ($campos as $campo) {
            $rules[$campo] = ['nullable', 'array'];
            $rules["{$campo}.*"] = ['file', 'mimes:pdf,jpg,jpeg,png,xls,xlsx', 'max:5120'];
        }

        return $rules;
    }
}
