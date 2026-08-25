<?php

namespace Tests\Feature\Gente;

use App\Models\GeovictoriaAsistencia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class GeovictoriaAsistenciaTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsRole(string $roleName): User
    {
        $role = Role::create(['name' => $roleName, 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    private function registro(array $overrides = []): GeovictoriaAsistencia
    {
        return GeovictoriaAsistencia::create([
            'identificador' => '12345678',
            'fecha' => now()->toDateString(),
            'apellidos' => 'Perez',
            'nombres' => 'Juan',
            'cargo' => 'Movilizador',
            'grupo' => 'Bogota',
            'entrada' => '06:00',
            'salida' => '18:00',
            'horas_trabajadas' => '11:30',
            'exceso_jornada' => true,
            'descanso_no_efectivo' => false,
            ...$overrides,
        ]);
    }

    public function test_gente_can_list_registros(): void
    {
        $user = $this->actingAsRole('Gente');
        $this->registro();
        $this->registro(['identificador' => '87654321', 'nombres' => 'Ana']);

        $response = $this->actingAs($user)->get(route('gente.asistencia-geovictoria.index'));

        $response->assertInertia(fn ($page) => $page->has('registros.data', 2));
    }

    public function test_reparto_can_also_access_the_module(): void
    {
        $user = $this->actingAsRole('Reparto');
        $this->registro();

        $this->actingAs($user)->get(route('gente.asistencia-geovictoria.index'))
            ->assertOk();
    }

    public function test_other_roles_cannot_access_the_module(): void
    {
        $user = $this->actingAsRole('Seguridad');

        $this->actingAs($user)->get(route('gente.asistencia-geovictoria.index'))
            ->assertForbidden();
    }

    public function test_indicadores_are_computed_correctly(): void
    {
        $user = $this->actingAsRole('Gente');
        $this->registro(['identificador' => 'A1', 'exceso_jornada' => true, 'descanso_no_efectivo' => false, 'horas_trabajadas' => '10:00']);
        $this->registro(['identificador' => 'A2', 'exceso_jornada' => false, 'descanso_no_efectivo' => true, 'horas_trabajadas' => '08:00']);
        $this->registro(['identificador' => 'A3', 'exceso_jornada' => false, 'descanso_no_efectivo' => false, 'horas_trabajadas' => '09:00']);

        $response = $this->actingAs($user)->get(route('gente.asistencia-geovictoria.index'));

        $response->assertInertia(function ($page) {
            $indicadores = $page->toArray()['props']['indicadores'];

            $this->assertSame(3, $indicadores['resumen']['total_registros']);
            $this->assertSame(3, $indicadores['resumen']['empleados']);
            $this->assertEquals(33.3, $indicadores['resumen']['pct_exceso_jornada']);
            $this->assertEquals(33.3, $indicadores['resumen']['pct_descanso_no_efectivo']);
            $this->assertSame('09:00', $indicadores['resumen']['promedio_horas_trabajadas']);

            $this->assertCount(30, $indicadores['tendencia_diaria']);
            $hoy = collect($indicadores['tendencia_diaria'])->last();
            $this->assertSame(1, $hoy['exceso_jornada']);
            $this->assertSame(1, $hoy['descanso_no_efectivo']);

            $topEmpleados = collect($indicadores['top_empleados'])->keyBy('identificador');
            $this->assertSame(1, $topEmpleados['A1']['total_exceso_jornada']);
            $this->assertSame(1, $topEmpleados['A2']['total_descanso_no_efectivo']);
            $this->assertArrayNotHasKey('A3', $topEmpleados);
        });
    }

    public function test_it_filters_by_search_and_tipo(): void
    {
        $user = $this->actingAsRole('Gente');
        $this->registro(['identificador' => '12345678', 'nombres' => 'Juan', 'exceso_jornada' => true, 'descanso_no_efectivo' => false]);
        $this->registro(['identificador' => '87654321', 'nombres' => 'Ana', 'exceso_jornada' => false, 'descanso_no_efectivo' => true]);

        $response = $this->actingAs($user)->get(route('gente.asistencia-geovictoria.index', ['search' => 'Ana']));
        $response->assertInertia(fn ($page) => $page->has('registros.data', 1));

        $response = $this->actingAs($user)->get(route('gente.asistencia-geovictoria.index', ['tipo' => 'exceso_jornada']));
        $response->assertInertia(fn ($page) => $page->has('registros.data', 1));
    }
}
