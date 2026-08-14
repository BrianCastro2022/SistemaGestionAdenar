<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Models\Seguridad\EvaluacionMedica;
use App\Models\Seguridad\EvaluacionRecomendacion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RecomendacionSeguimientoController extends Controller
{
    public function store(Request $request, EvaluacionMedica $evaluacion, EvaluacionRecomendacion $evaluacionRecomendacion): RedirectResponse
    {
        $data = $request->validate([
            'fecha_seguimiento' => ['required', 'date'],
            'estado_seguimiento' => ['required', Rule::in(config('seguridad.examenes_medicos.recomendaciones.estados_seguimiento'))],
            'observacion' => ['nullable', 'string', 'max:2000'],
            'fecha_proximo_seguimiento' => ['nullable', 'date'],
            'carta_recomendacion_entregada' => ['nullable', 'boolean'],
            'soporte' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:5120'],
        ]);

        $soportePath = null;

        if ($request->hasFile('soporte')) {
            $soportePath = $request->file('soporte')->store('recomendaciones-seguimientos', 'public');
        }

        $evaluacionRecomendacion->seguimientos()->create([
            'fecha_seguimiento' => $data['fecha_seguimiento'],
            'estado_seguimiento' => $data['estado_seguimiento'],
            'observacion' => $data['observacion'] ?? null,
            'responsable_id' => $request->user()->id,
            'fecha_proximo_seguimiento' => $data['fecha_proximo_seguimiento'] ?? null,
            'carta_recomendacion_entregada' => $data['carta_recomendacion_entregada'] ?? false,
            'soporte_path' => $soportePath,
        ]);

        return back()->with('status', 'Seguimiento registrado.');
    }
}
