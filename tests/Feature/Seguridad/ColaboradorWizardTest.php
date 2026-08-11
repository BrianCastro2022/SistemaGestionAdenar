<?php

namespace Tests\Feature\Seguridad;

use App\Models\Seguridad\Colaborador;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ColaboradorWizardTest extends TestCase
{
    use RefreshDatabase;

    private function seguridadUser(): User
    {
        Role::create(['name' => 'Seguridad', 'guard_name' => 'web']);
        Role::create(['name' => 'Colaborador', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole('Seguridad');

        return $user;
    }

    public function test_full_wizard_flow_creates_a_complete_colaborador_with_cargo_history(): void
    {
        $user = $this->seguridadUser();

        // Paso 1: crea el borrador.
        $response = $this->actingAs($user)->post(route('seguridad.colaboradores.store'), [
            'cedula' => '900100200',
            'nombres' => 'Ana',
            'apellidos' => 'Torres',
            'eps' => 'SANITAS',
            'arl' => 'ARL SURA',
        ]);

        $colaborador = Colaborador::where('cedula', '900100200')->firstOrFail();
        $response->assertRedirect(route('seguridad.colaboradores.wizard', $colaborador));
        $this->assertSame('borrador', $colaborador->estado_registro);
        $this->assertSame(1, $colaborador->wizard_step);

        // Paso 2.
        $this->actingAs($user)->patch(route('seguridad.colaboradores.paso2.update', $colaborador), [
            '_method' => 'PATCH',
            'tiene_experiencia' => 'no',
            'experiencia_terreno_plano' => 'no',
        ])->assertRedirect(route('seguridad.colaboradores.wizard', ['colaborador' => $colaborador, 'paso' => 3]));

        $colaborador->refresh();
        $this->assertSame(2, $colaborador->wizard_step);

        // Paso 3: primera asignación de cargo.
        $this->actingAs($user)->patch(route('seguridad.colaboradores.paso3.update', $colaborador), [
            'area' => 'Operativa',
            'cargo' => 'CONDUCTOR',
            'cargo_fecha_inicio' => '2026-01-01',
            'centro' => 'UC',
        ])->assertRedirect(route('seguridad.colaboradores.wizard', ['colaborador' => $colaborador, 'paso' => 4]));

        $colaborador->refresh();
        $this->assertSame('CONDUCTOR', $colaborador->cargo);
        $this->assertSame(3, $colaborador->wizard_step);
        $this->assertCount(1, $colaborador->cargos);
        $this->assertSame('CONDUCTOR', $colaborador->cargoActual->cargo);
        $this->assertSame('ACTIVO', $colaborador->cargoActual->estado);

        // Vuelve al Paso 3 y cambia de cargo: debe cerrar el anterior y abrir uno nuevo.
        $this->actingAs($user)->patch(route('seguridad.colaboradores.paso3.update', $colaborador), [
            'area' => 'Administrativa',
            'cargo' => 'SUPERVISOR DE ÁREA',
            'cargo_fecha_inicio' => '2026-02-01',
            'centro' => 'UC',
        ]);

        $colaborador->refresh();
        $historial = $colaborador->cargos()->orderBy('fecha_inicio')->get();
        $this->assertCount(2, $historial);
        $this->assertSame('CONDUCTOR', $historial[0]->cargo);
        $this->assertSame('INACTIVO', $historial[0]->estado);
        $this->assertSame('2026-01-31', $historial[0]->fecha_fin->toDateString());
        $this->assertSame('SUPERVISOR DE ÁREA', $historial[1]->cargo);
        $this->assertSame('ACTIVO', $historial[1]->estado);
        $this->assertSame('SUPERVISOR DE ÁREA', $colaborador->cargo);

        // Paso 4: completa el registro.
        $this->actingAs($user)->patch(route('seguridad.colaboradores.paso4.update', $colaborador), [
            'es_padrino' => 'no_aplica',
        ])->assertRedirect(route('seguridad.colaboradores.show', $colaborador));

        $colaborador->refresh();
        $this->assertSame('completo', $colaborador->estado_registro);
        $this->assertSame(4, $colaborador->wizard_step);
    }

    public function test_draft_colaboradores_are_excluded_from_the_default_index_listing(): void
    {
        $user = $this->seguridadUser();

        $this->actingAs($user)->post(route('seguridad.colaboradores.store'), [
            'cedula' => '900100201',
            'nombres' => 'Borrador',
            'apellidos' => 'Sin Terminar',
        ]);

        $response = $this->actingAs($user)->get(route('seguridad.colaboradores.index'));

        $response->assertInertia(fn ($page) => $page
            ->where('colaboradores.data', [])
            ->where('borradoresCount', 1)
        );
    }

    public function test_editing_a_complete_colaborador_opens_the_wizard_on_paso_1_with_linkable_users(): void
    {
        $user = $this->seguridadUser();

        $colaborador = Colaborador::create([
            'cedula' => '900100202',
            'nombres' => 'Marta',
            'apellidos' => 'Ríos',
            'is_active' => true,
            'estado_registro' => 'completo',
            'wizard_step' => 4,
        ]);

        $response = $this->actingAs($user)->get(route('seguridad.colaboradores.edit', $colaborador));

        $response->assertInertia(fn ($page) => $page
            ->component('seguridad/colaboradores/wizard/index')
            ->where('currentStep', 1)
            ->has('usuarios')
        );
    }

    public function test_paso1_update_can_change_the_linked_user(): void
    {
        $user = $this->seguridadUser();

        $colaborador = Colaborador::create([
            'cedula' => '900100203',
            'nombres' => 'Pedro',
            'apellidos' => 'Gómez',
            'estado_registro' => 'borrador',
            'wizard_step' => 0,
        ]);

        $cuenta = User::factory()->create();

        $this->actingAs($user)->patch(route('seguridad.colaboradores.paso1.update', $colaborador), [
            'cedula' => '900100203',
            'nombres' => 'Pedro',
            'apellidos' => 'Gómez',
            'user_id' => $cuenta->id,
        ])->assertRedirect(route('seguridad.colaboradores.wizard', ['colaborador' => $colaborador, 'paso' => 2]));

        $this->assertSame($cuenta->id, $colaborador->fresh()->user_id);
    }

    public function test_paso1_update_preserves_the_existing_photo_when_no_new_file_is_uploaded(): void
    {
        $user = $this->seguridadUser();

        $colaborador = Colaborador::create([
            'cedula' => '900100204',
            'nombres' => 'Laura',
            'apellidos' => 'Vega',
            'estado_registro' => 'borrador',
            'wizard_step' => 0,
            'imagen' => 'colaboradores/foto-existente.jpg',
        ]);

        // Inertia siempre envía todos los campos del formulario, incluido
        // 'imagen' vacío cuando no se eligió una foto nueva.
        $this->actingAs($user)->patch(route('seguridad.colaboradores.paso1.update', $colaborador), [
            'cedula' => '900100204',
            'nombres' => 'Laura',
            'apellidos' => 'Vega',
            'imagen' => '',
        ])->assertRedirect(route('seguridad.colaboradores.wizard', ['colaborador' => $colaborador, 'paso' => 2]));

        $this->assertSame('colaboradores/foto-existente.jpg', $colaborador->fresh()->imagen);
    }

    public function test_paso3_update_does_not_fail_when_resubmitting_unchanged_past_dates(): void
    {
        $user = $this->seguridadUser();

        $desde = now()->subYears(3)->toDateString();
        $hasta = now()->subYears(3)->addMonths(5)->toDateString();

        $colaborador = Colaborador::create([
            'cedula' => '900100205',
            'nombres' => 'Mario',
            'apellidos' => 'Ruiz',
            'estado_registro' => 'borrador',
            'wizard_step' => 2,
            'contrato_fecha_desde' => $desde,
            'contrato_fecha_hasta' => $hasta,
            'vacaciones_aplica' => 'aplica',
            'vacaciones_fecha_desde' => $desde,
            'vacaciones_fecha_hasta' => $hasta,
            'vacaciones_pagadas_fecha_desde' => $desde,
            'vacaciones_pagadas_fecha_hasta' => $hasta,
        ]);

        $this->actingAs($user)->patch(route('seguridad.colaboradores.paso3.update', $colaborador), [
            'contrato_fecha_desde' => $desde,
            'contrato_fecha_hasta' => $hasta,
            'vacaciones_aplica' => 'aplica',
            'vacaciones_fecha_desde' => $desde,
            'vacaciones_fecha_hasta' => $hasta,
            'vacaciones_pagadas_fecha_desde' => $desde,
            'vacaciones_pagadas_fecha_hasta' => $hasta,
        ])->assertRedirect(route('seguridad.colaboradores.wizard', ['colaborador' => $colaborador, 'paso' => 4]));

        $this->assertSame(3, $colaborador->fresh()->wizard_step);
    }

    public function test_wizard_page_serves_dates_as_plain_dates_and_resubmitting_them_unchanged_advances_the_step(): void
    {
        $user = $this->seguridadUser();

        $desde = now()->subYears(3)->toDateString();
        $hasta = now()->subYears(3)->addMonths(5)->toDateString();

        $colaborador = Colaborador::create([
            'cedula' => '900100207',
            'nombres' => 'Elena',
            'apellidos' => 'Prieto',
            'estado_registro' => 'borrador',
            'wizard_step' => 2,
            'cargo' => 'CONDUCTOR',
            'contrato_fecha_desde' => $desde,
            'contrato_fecha_hasta' => $hasta,
            'vacaciones_aplica' => 'aplica',
            'vacaciones_fecha_desde' => $desde,
            'vacaciones_fecha_hasta' => $hasta,
            'vacaciones_pagadas_fecha_desde' => $desde,
            'vacaciones_pagadas_fecha_hasta' => $hasta,
        ]);
        // Igual que cualquier colaborador con un cargo ya asignado (lo normal
        // al editar): tiene un registro de historial de cargos activo.
        $colaborador->cargos()->create([
            'cargo' => 'CONDUCTOR',
            'fecha_inicio' => $desde,
            'estado' => 'ACTIVO',
        ]);

        // Lo que el navegador realmente recibe y volvería a enviar tal cual,
        // sin que el usuario toque nada — no un valor sintético del test.
        $wizardResponse = $this->actingAs($user)->get(route('seguridad.colaboradores.wizard', ['colaborador' => $colaborador, 'paso' => 3]));
        $props = $wizardResponse->viewData('page')['props'];

        $this->assertSame($hasta, $props['colaborador']['contrato_fecha_hasta']);

        $this->actingAs($user)->patch(route('seguridad.colaboradores.paso3.update', $colaborador), [
            // El formulario siempre envía 'cargo' (aunque no cambie) y
            // 'cargo_fecha_inicio' vacío cuando el cargo no se está cambiando.
            'cargo' => $props['colaborador']['cargo'],
            'cargo_fecha_inicio' => '',
            'contrato_fecha_desde' => $props['colaborador']['contrato_fecha_desde'],
            'contrato_fecha_hasta' => $props['colaborador']['contrato_fecha_hasta'],
            'vacaciones_aplica' => $props['colaborador']['vacaciones_aplica'],
            'vacaciones_fecha_desde' => $props['colaborador']['vacaciones_fecha_desde'],
            'vacaciones_fecha_hasta' => $props['colaborador']['vacaciones_fecha_hasta'],
            'vacaciones_pagadas_fecha_desde' => $props['colaborador']['vacaciones_pagadas_fecha_desde'],
            'vacaciones_pagadas_fecha_hasta' => $props['colaborador']['vacaciones_pagadas_fecha_hasta'],
        ])->assertRedirect(route('seguridad.colaboradores.wizard', ['colaborador' => $colaborador, 'paso' => 4]));
    }

    public function test_paso3_update_still_rejects_a_new_past_date(): void
    {
        $user = $this->seguridadUser();

        $colaborador = Colaborador::create([
            'cedula' => '900100206',
            'nombres' => 'Nora',
            'apellidos' => 'Salas',
            'estado_registro' => 'borrador',
            'wizard_step' => 2,
        ]);

        $this->actingAs($user)->patch(route('seguridad.colaboradores.paso3.update', $colaborador), [
            'fecha_retiro_empresa' => now()->subDay()->toDateString(),
        ])->assertSessionHasErrors('fecha_retiro_empresa');

        $this->assertNull($colaborador->fresh()->fecha_retiro_empresa);
    }

    public function test_paso3_update_still_requires_a_start_date_when_the_cargo_actually_changes(): void
    {
        $user = $this->seguridadUser();

        $colaborador = Colaborador::create([
            'cedula' => '900100208',
            'nombres' => 'Tomas',
            'apellidos' => 'León',
            'estado_registro' => 'borrador',
            'wizard_step' => 2,
            'cargo' => 'CONDUCTOR',
        ]);
        $colaborador->cargos()->create([
            'cargo' => 'CONDUCTOR',
            'fecha_inicio' => now()->subYear()->toDateString(),
            'estado' => 'ACTIVO',
        ]);

        $this->actingAs($user)->patch(route('seguridad.colaboradores.paso3.update', $colaborador), [
            'cargo' => 'SUPERVISOR DE ÁREA',
            'cargo_fecha_inicio' => '',
        ])->assertSessionHasErrors('cargo_fecha_inicio');
    }
}
