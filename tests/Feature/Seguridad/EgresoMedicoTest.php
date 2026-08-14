<?php

namespace Tests\Feature\Seguridad;

use App\Models\Seguridad\Colaborador;
use App\Models\Seguridad\ConceptoAptitud;
use App\Models\Seguridad\EvaluacionMedica;
use App\Models\User;
use App\Services\Seguridad\EvaluacionMedicaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EgresoMedicoTest extends TestCase
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

    private function colaborador(): Colaborador
    {
        return Colaborador::create([
            'cedula' => '900'.random_int(100000, 999999),
            'nombres' => 'Test', 'apellidos' => 'Colaborador',
            'estado_registro' => 'completo', 'cargo' => 'CONDUCTOR',
            'contrato_fecha_desde' => now()->subYear(),
            'contrato_fecha_hasta' => now()->addDays(20),
        ]);
    }

    public function test_crear_evaluacion_de_egreso_no_genera_examenes_de_matriz(): void
    {
        $colaborador = $this->colaborador();

        $evaluacion = (new EvaluacionMedicaService())->crearEgreso($colaborador);

        $this->assertSame('egreso', $evaluacion->tipo_evaluacion);
        $this->assertSame('pendiente', $evaluacion->estado);
        $this->assertSame(0, $evaluacion->examenes()->count());
    }

    public function test_crear_evaluacion_de_egreso_via_http(): void
    {
        $user = $this->seguridadUser();
        $colaborador = $this->colaborador();

        $response = $this->actingAs($user)->post(route('seguridad.examenes-medicos.store'), [
            'colaborador_id' => $colaborador->id,
            'tipo_evaluacion' => 'egreso',
        ]);

        $response->assertSessionHasNoErrors();
        $evaluacion = EvaluacionMedica::where('colaborador_id', $colaborador->id)->firstOrFail();
        $this->assertSame('egreso', $evaluacion->tipo_evaluacion);
    }

    public function test_show_renderiza_la_pagina_especifica_de_egreso(): void
    {
        $user = $this->seguridadUser();
        $colaborador = $this->colaborador();
        $evaluacion = (new EvaluacionMedicaService())->crearEgreso($colaborador);

        $response = $this->actingAs($user)->get(route('seguridad.examenes-medicos.show', $evaluacion));

        $response->assertInertia(fn ($page) => $page->component('seguridad/examenes-medicos/egreso-show'));
    }

    public function test_programar_y_ejecutar_actualiza_el_estado_pendiente_programado_ejecutado(): void
    {
        $user = $this->seguridadUser();
        $colaborador = $this->colaborador();
        $evaluacion = (new EvaluacionMedicaService())->crearEgreso($colaborador);

        $this->assertSame('pendiente', $evaluacion->estado);

        $this->actingAs($user)->patch(
            route('seguridad.examenes-medicos.egreso.programar', $evaluacion),
            ['fecha_programacion' => now()->addDays(3)->toDateString()],
        )->assertSessionHasNoErrors();

        $this->assertSame('programado', $evaluacion->fresh()->estado);

        $this->actingAs($user)->patch(
            route('seguridad.examenes-medicos.egreso.ejecutar', $evaluacion),
            ['fecha_examen_ejecutado' => now()->toDateString()],
        )->assertSessionHasNoErrors();

        $evaluacion->refresh();
        $this->assertSame('ejecutado', $evaluacion->estado);
        $this->assertNotNull($evaluacion->fecha_examen_ejecutado);
    }

    public function test_concepto_de_aptitud_emite_y_observacion_se_guardan_sin_romper_el_estado_de_egreso(): void
    {
        $user = $this->seguridadUser();
        $colaborador = $this->colaborador();
        $concepto = ConceptoAptitud::create(['nombre' => 'Satisfactorio', 'activo' => true]);
        $evaluacion = (new EvaluacionMedicaService())->crearEgreso($colaborador);
        $evaluacion->update(['fecha_examen_ejecutado' => now()->toDateString(), 'estado' => 'ejecutado']);

        $this->actingAs($user)->patch(
            route('seguridad.examenes-medicos.concepto-aptitud', $evaluacion),
            ['concepto_aptitud_id' => $concepto->id, 'emite' => 'IPS Salud', 'observacion' => 'Sin novedad.'],
        )->assertSessionHasNoErrors();

        $evaluacion->refresh();
        $this->assertSame($concepto->id, $evaluacion->concepto_aptitud_id);
        $this->assertSame('IPS Salud', $evaluacion->emite);
        $this->assertSame('Sin novedad.', $evaluacion->observacion);
        // No debe reescribirse a sin_iniciar por recalcularEstado() (esa lógica es solo de ingreso/periódico).
        $this->assertSame('ejecutado', $evaluacion->estado);
    }

    public function test_seguimiento_a_recomendaciones_requiere_detalle_solo_para_la_opcion_otro(): void
    {
        $user = $this->seguridadUser();
        $colaborador = $this->colaborador();
        $evaluacion = (new EvaluacionMedicaService())->crearEgreso($colaborador);

        $this->actingAs($user)->patch(
            route('seguridad.examenes-medicos.egreso.seguimiento', $evaluacion),
            ['seguimiento_recomendaciones' => 'Egreso sin cambio aparente al ingreso'],
        )->assertSessionHasNoErrors();
        $this->assertSame('Egreso sin cambio aparente al ingreso', $evaluacion->fresh()->seguimiento_recomendaciones);

        $this->actingAs($user)->patch(
            route('seguridad.examenes-medicos.egreso.seguimiento', $evaluacion),
            ['seguimiento_recomendaciones' => 'Soporte desestimiento u otro'],
        )->assertSessionHasErrors('seguimiento_recomendaciones_detalle');

        $this->actingAs($user)->patch(
            route('seguridad.examenes-medicos.egreso.seguimiento', $evaluacion),
            ['seguimiento_recomendaciones' => 'Soporte desestimiento u otro', 'seguimiento_recomendaciones_detalle' => 'Carta de desestimiento anexa.'],
        )->assertSessionHasNoErrors();

        $evaluacion->refresh();
        $this->assertSame('Soporte desestimiento u otro', $evaluacion->seguimiento_recomendaciones);
        $this->assertSame('Carta de desestimiento anexa.', $evaluacion->seguimiento_recomendaciones_detalle);
    }

    public function test_bandeja_excluye_egresos_ejecutados_salvo_que_se_pida_el_historial(): void
    {
        $user = $this->seguridadUser();

        // HU-037: el colaborador() de este test ya trae contrato_fecha_hasta,
        // así que el examen de egreso se genera automáticamente al crearlo
        // (no hace falta — ni se debe — invocar crearEgreso() a mano).
        $colaboradorPendiente = $this->colaborador();
        $colaboradorEjecutado = $this->colaborador();

        $pendiente = EvaluacionMedica::where('colaborador_id', $colaboradorPendiente->id)->where('tipo_evaluacion', 'egreso')->firstOrFail();
        $ejecutado = EvaluacionMedica::where('colaborador_id', $colaboradorEjecutado->id)->where('tipo_evaluacion', 'egreso')->firstOrFail();
        $ejecutado->update(['fecha_examen_ejecutado' => now()->toDateString(), 'estado' => 'ejecutado']);

        $activas = $this->actingAs($user)->get(route('seguridad.examenes-medicos.index', ['tipo_evaluacion' => 'egreso']));
        $activas->assertInertia(fn ($page) => $page->where('evaluaciones.data', fn ($data) => count($data) === 1));

        $conHistorial = $this->actingAs($user)->get(
            route('seguridad.examenes-medicos.index', ['tipo_evaluacion' => 'egreso', 'ver_historial' => '1']),
        );
        $conHistorial->assertInertia(fn ($page) => $page->where('evaluaciones.data', fn ($data) => count($data) === 2));
    }

    public function test_crear_colaborador_con_contrato_fecha_hasta_genera_automaticamente_el_egreso(): void
    {
        // HU-037: colaborador() de este test ya trae contrato_fecha_hasta.
        $colaborador = $this->colaborador();

        $egreso = EvaluacionMedica::where('colaborador_id', $colaborador->id)->where('tipo_evaluacion', 'egreso')->first();

        $this->assertNotNull($egreso);
        $this->assertSame('pendiente', $egreso->estado);
        $this->assertSame($colaborador->contrato_fecha_hasta->toDateString(), $egreso->fecha_limite->toDateString());
        $this->assertSame($colaborador->contrato_fecha_hasta->toDateString(), $egreso->fecha_programacion->toDateString());
    }

    public function test_actualizar_la_fecha_fin_de_contrato_resincroniza_el_egreso_pendiente(): void
    {
        $colaborador = $this->colaborador();
        $nuevaFecha = now()->addDays(45)->toDateString();

        $colaborador->update(['contrato_fecha_hasta' => $nuevaFecha]);

        $egreso = EvaluacionMedica::where('colaborador_id', $colaborador->id)->where('tipo_evaluacion', 'egreso')->firstOrFail();
        $this->assertSame($nuevaFecha, $egreso->fecha_limite->toDateString());
        $this->assertSame(1, EvaluacionMedica::where('colaborador_id', $colaborador->id)->where('tipo_evaluacion', 'egreso')->count());
    }

    public function test_actualizar_fecha_fin_de_contrato_no_toca_un_egreso_ya_ejecutado(): void
    {
        $colaborador = $this->colaborador();
        $egreso = EvaluacionMedica::where('colaborador_id', $colaborador->id)->where('tipo_evaluacion', 'egreso')->firstOrFail();
        $egreso->update(['fecha_examen_ejecutado' => now()->toDateString(), 'estado' => 'ejecutado']);

        $colaborador->update(['contrato_fecha_hasta' => now()->addDays(90)->toDateString()]);

        $this->assertSame('ejecutado', $egreso->fresh()->estado);
    }

    public function test_ejecutar_egreso_admite_certificado_adjunto(): void
    {
        $user = $this->seguridadUser();
        $colaborador = $this->colaborador();
        $evaluacion = EvaluacionMedica::where('colaborador_id', $colaborador->id)->where('tipo_evaluacion', 'egreso')->firstOrFail();
        $archivo = UploadedFile::fake()->create('certificado.pdf', 100, 'application/pdf');

        $this->actingAs($user)->patch(
            route('seguridad.examenes-medicos.egreso.ejecutar', $evaluacion),
            ['fecha_examen_ejecutado' => now()->toDateString(), 'soporte' => $archivo],
        )->assertSessionHasNoErrors();

        $evaluacion->refresh();
        $this->assertSame('ejecutado', $evaluacion->estado);
        $this->assertNotNull($evaluacion->soporte_path);
    }

    public function test_rechazar_egreso_marca_tipo_cierre_y_no_permite_reenviar_sin_observacion(): void
    {
        $user = $this->seguridadUser();
        $colaborador = $this->colaborador();
        $evaluacion = EvaluacionMedica::where('colaborador_id', $colaborador->id)->where('tipo_evaluacion', 'egreso')->firstOrFail();

        $this->actingAs($user)->patch(
            route('seguridad.examenes-medicos.egreso.rechazar', $evaluacion),
            [],
        )->assertSessionHasErrors('observacion_rechazo');

        $this->actingAs($user)->patch(
            route('seguridad.examenes-medicos.egreso.rechazar', $evaluacion),
            ['observacion_rechazo' => 'El colaborador se negó a realizar el examen.'],
        )->assertSessionHasNoErrors();

        $evaluacion->refresh();
        $this->assertSame('rechazado', $evaluacion->tipo_cierre);
        $this->assertSame('ejecutado', $evaluacion->estado);
        $this->assertNotNull($evaluacion->fecha_rechazo);
        $this->assertSame('El colaborador se negó a realizar el examen.', $evaluacion->observacion_rechazo);
    }
}
