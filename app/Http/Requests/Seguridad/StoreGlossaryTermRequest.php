<?php

<<<<<<< HEAD
namespace App\Http\Requests\Seguridad;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGlossaryTermRequest extends FormRequest
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
        $categories = [
            'SEÑALIZACIÓN DE LA VÍA',
            'CONDICIONES DEL PAVIMENTO',
            'VISIBILIDAD Y CLIMA',
            'COMPORTAMIENTO DEL CONDUCTOR',
            'ESTADO DEL VEHÍCULO',
            'SEÑALES DE TRÁNSITO',
        ];

        return [
            'nombre' => [
                'required',
                'string',
                'max:255',
                Rule::unique('glossary_terms', 'nombre')
                    ->where('categoria', $this->input('categoria'))
                    ->whereNull('deleted_at')
                    ->ignore($this->route('term')),
            ],
            'definicion' => ['required', 'string', 'min:10', 'max:5000'],
            'categoria' => ['required', 'string', Rule::in($categories)],
            'pregunta_numero' => ['nullable', 'string', 'max:50'],
            'representacion' => ['nullable', 'string', 'max:2000'],
            'enlaces_de_interes' => ['nullable', 'url', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del término es obligatorio.',
            'nombre.unique' => 'Este término ya existe en la categoría seleccionada.',
            'definicion.required' => 'La definición es obligatoria.',
            'definicion.min' => 'La definición debe tener al menos 10 caracteres.',
            'categoria.required' => 'Debes seleccionar una categoría.',
            'categoria.in' => 'La categoría seleccionada no es válida.',
            'enlaces_de_interes.url' => 'El enlace debe ser una URL válida.',
        ];
    }
}

