<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Models\Seguridad\EvaluacionMedica;
use App\Models\Seguridad\EvaluacionRecomendacion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EvaluacionRecomendacionController extends Controller
{
    public function store(Request $request, EvaluacionMedica $evaluacion): RedirectResponse
    {
        $data = $request->validate([
            'recomendacion_id' => [
                'required', 'integer', 'exists:recomendaciones,id',
                Rule::unique('evaluacion_recomendaciones', 'recomendacion_id')->where('evaluacion_medica_id', $evaluacion->id),
            ],
            'observacion' => ['nullable', 'string', 'max:2000'],
        ]);

        $evaluacion->recomendaciones()->create([
            'recomendacion_id' => $data['recomendacion_id'],
            'observacion' => $data['observacion'] ?? null,
            'activa' => true,
            'fecha_registro' => now()->toDateString(),
        ]);

        return back()->with('status', 'Recomendación agregada.');
    }

    /**
     * HU-054 regla 3: el seguimiento no elimina la recomendación — solo se
     * marca como no vigente para conservar el histórico.
     */
    public function toggleActiva(EvaluacionMedica $evaluacion, EvaluacionRecomendacion $evaluacionRecomendacion): RedirectResponse
    {
        $evaluacionRecomendacion->update(['activa' => ! $evaluacionRecomendacion->activa]);

        return back()->with('status', $evaluacionRecomendacion->activa ? 'Recomendación marcada como vigente.' : 'Recomendación marcada como no vigente.');
    }
}
