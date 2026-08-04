<?php

namespace Tests\Feature\Seguridad;

use App\Models\Seguridad\Colaborador;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AsignacionConductorTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_can_store_a_conductor_assignment_for_an_existing_colaborador(): void
    {
        $role = Role::create(['name' => 'Seguridad', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $colaborador = Colaborador::create([
            'cedula' => '1002003004',
            'nombres' => 'Carlos',
            'apellidos' => 'Mendoza',
            'cargo' => 'Conductor',
            'turno' => 'manana',
            'area' => 'Ruta Norte',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->post(route('seguridad.asignaciones-conductores.store'), [
            'colaborador_id' => $colaborador->id,
            'cedula' => $colaborador->cedula,
            'experiencia_conduccion_camiones_externa' => 'Sí',
            'experiencia_total_operacion_interna' => '5 años',
            'tiempo_dos_anos_conductor_externa' => 'Sí',
            'experiencia_terreno_plano' => 'Sí',
            'experiencia_terreno_montañoso' => 'No',
            'nivel_skap' => 'A',
            'participa_reportes_aci' => 'Sí',
            'historico_accidentes_incidentes' => 'Sin registros',
            'uso_bebidas_alcoholicas' => 'No',
            'uso_cigarrillos' => 'No',
            'uso_medicamentos_controlados' => 'No',
            'obesidad' => 'No',
            'problemas_salud_diagnosticados' => 'No',
            'restricciones_resultados_emo' => 'No',
            'curso_manejo_defensivo' => 'Sí',
            'certificado_escuela_pilotos' => 'Sí',
            'comparendos' => 'No',
            'eventos_criticos_telemetria' => 'No',
            'adherencia_checklist_preoperacional' => '100%',
            'entrenamiento_rutas_criticas' => 'Sí',
            'prueba_alcohol_positiva_mes' => 'No',
            'capacitacion_brigadista' => 'Sí',
            'owd_cumplimiento_prestartas' => '100%',
            'entrenamiento_caja_cambios' => 'Sí',
            'entrenamiento_frenos' => 'Sí',
            'entrenamiento_no_neutro' => 'Sí',
            'cumplimiento' => 'Cumple',
            'apto_rutas_criticas' => 'Sí',
            'programar_rutas' => 'Ruta Norte',
            'rutas_cd' => 'CD-01',
            'criticidad_matriz_rutas' => 'Alta',
        ]);

        $response->assertRedirect(route('seguridad.asignaciones-conductores.index'));
        $this->assertDatabaseHas('asignacion_conductores', [
            'colaborador_id' => $colaborador->id,
            'cedula' => $colaborador->cedula,
            'cumplimiento' => 'Cumple',
        ]);
    }

    public function test_it_redirects_to_the_existing_evaluation_when_the_same_colaborador_is_evaluated_again(): void
    {
        $role = Role::create(['name' => 'Seguridad', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $colaborador = Colaborador::create([
            'cedula' => '1002003005',
            'nombres' => 'Ana',
            'apellidos' => 'Lopez',
            'cargo' => 'Conductor',
            'turno' => 'manana',
            'area' => 'Ruta Norte',
            'is_active' => true,
        ]);

        $existing = \App\Models\Seguridad\AsignacionConductor::create([
            'colaborador_id' => $colaborador->id,
            'cedula' => $colaborador->cedula,
            'cumplimiento' => 'Cumple',
            'observaciones' => 'Primera evaluación',
        ]);

        $response = $this->actingAs($user)->get(route('seguridad.asignaciones-conductores.create', [
            'colaborador_id' => $colaborador->id,
            'cedula' => $colaborador->cedula,
        ]));

        $response->assertRedirect(route('seguridad.asignaciones-conductores.edit', $existing));
    }
}
