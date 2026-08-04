<?php

namespace App\Models\Seguridad;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsignacionConductor extends Model
{
    protected $table = 'asignacion_conductores';

    protected $fillable = [
        'colaborador_id',
        'cedula',
        'experiencia_conduccion_camiones_externa',
        'experiencia_total_operacion_interna',
        'tiempo_dos_anos_conductor_externa',
        'experiencia_terreno_plano',
        'experiencia_terreno_montañoso',
        'nivel_skap',
        'participa_reportes_aci',
        'historico_accidentes_incidentes',
        'uso_bebidas_alcoholicas',
        'uso_cigarrillos',
        'uso_medicamentos_controlados',
        'obesidad',
        'problemas_salud_diagnosticados',
        'restricciones_resultados_emo',
        'curso_manejo_defensivo',
        'certificado_escuela_pilotos',
        'comparendos',
        'eventos_criticos_telemetria',
        'adherencia_checklist_preoperacional',
        'entrenamiento_rutas_criticas',
        'prueba_alcohol_positiva_mes',
        'capacitacion_brigadista',
        'owd_cumplimiento_prestartas',
        'entrenamiento_caja_cambios',
        'entrenamiento_frenos',
        'entrenamiento_no_neutro',
        'cumplimiento',
        'apto_rutas_criticas',
        'programar_rutas',
        'rutas_cd',
        'criticidad_matriz_rutas',
        'observaciones',
    ];

    public function colaborador(): BelongsTo
    {
        return $this->belongsTo(Colaborador::class);
    }
}
