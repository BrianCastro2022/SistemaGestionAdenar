<?php

namespace Tests\Feature\Seguridad;

use App\Models\Seguridad\Colaborador;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ColaboradorToggleActivoTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_toggles_is_active_on_each_call(): void
    {
        Role::create(['name' => 'Seguridad', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole('Seguridad');

        $colaborador = Colaborador::create([
            'cedula' => '600100200',
            'nombres' => 'Diego',
            'apellidos' => 'Salas',
            'is_active' => true,
            'estado_registro' => 'completo',
            'wizard_step' => 4,
        ]);

        $this->actingAs($user)->patch(route('seguridad.colaboradores.toggle-activo', $colaborador))->assertRedirect();
        $this->assertFalse($colaborador->fresh()->is_active);

        $this->actingAs($user)->patch(route('seguridad.colaboradores.toggle-activo', $colaborador))->assertRedirect();
        $this->assertTrue($colaborador->fresh()->is_active);
    }
}
