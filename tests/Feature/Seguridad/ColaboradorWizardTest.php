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
}
