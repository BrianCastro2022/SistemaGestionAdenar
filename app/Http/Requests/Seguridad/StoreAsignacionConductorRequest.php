<?php

namespace App\Http\Requests\Seguridad;

use Illuminate\Foundation\Http\FormRequest;

class StoreAsignacionConductorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'colaborador_id' => ['nullable', 'exists:colaboradores,id'],
            'cedula' => ['nullable', 'string', 'max:20'],
            'experiencia_conduccion_camiones_externa' => ['nullable', 'string', 'max:255'],
            'experiencia_total_operacion_interna' => ['nullable', 'string', 'max:255'],
            'tiempo_dos_anos_conductor_externa' => ['nullable', 'string', 'max:255'],
            'experiencia_terreno_plano' => ['nullable', 'string', 'max:255'],
            'experiencia_terreno_montañoso' => ['nullable', 'string', 'max:255'],
            'nivel_skap' => ['nullable', 'string', 'max:255'],
            'participa_reportes_aci' => ['nullable', 'string', 'max:255'],
            'historico_accidentes_incidentes' => ['nullable', 'string', 'max:255'],
            'uso_bebidas_alcoholicas' => ['nullable', 'string', 'max:255'],
            'uso_cigarrillos' => ['nullable', 'string', 'max:255'],
            'uso_medicamentos_controlados' => ['nullable', 'string', 'max:255'],
            'obesidad' => ['nullable', 'string', 'max:255'],
            'problemas_salud_diagnosticados' => ['nullable', 'string', 'max:255'],
            'restricciones_resultados_emo' => ['nullable', 'string', 'max:255'],
            'curso_manejo_defensivo' => ['nullable', 'string', 'max:255'],
            'certificado_escuela_pilotos' => ['nullable', 'string', 'max:255'],
            'comparendos' => ['nullable', 'string', 'max:255'],
            'eventos_criticos_telemetria' => ['nullable', 'string', 'max:255'],
            'adherencia_checklist_preoperacional' => ['nullable', 'string', 'max:255'],
            'entrenamiento_rutas_criticas' => ['nullable', 'string', 'max:255'],
            'prueba_alcohol_positiva_mes' => ['nullable', 'string', 'max:255'],
            'capacitacion_brigadista' => ['nullable', 'string', 'max:255'],
            'owd_cumplimiento_prestartas' => ['nullable', 'string', 'max:255'],
            'entrenamiento_caja_cambios' => ['nullable', 'string', 'max:255'],
            'entrenamiento_frenos' => ['nullable', 'string', 'max:255'],
            'entrenamiento_no_neutro' => ['nullable', 'string', 'max:255'],
            'cumplimiento' => ['nullable', 'string', 'max:255'],
            'apto_rutas_criticas' => ['nullable', 'string', 'max:255'],
            'programar_rutas' => ['nullable', 'string', 'max:255'],
            'rutas_cd' => ['nullable', 'string', 'max:255'],
            'criticidad_matriz_rutas' => ['nullable', 'string', 'max:255'],
            'observaciones' => ['nullable', 'string'],
        ];
    }
}
