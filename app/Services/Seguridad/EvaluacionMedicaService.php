<?php

namespace App\Services\Seguridad;

use App\Models\Seguridad\CargoExamen;
use App\Models\Seguridad\Colaborador;
use App\Models\Seguridad\EvaluacionMedica;
use App\Models\Seguridad\LogGeneracionExamenes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class EvaluacionMedicaService
{
    /**
     * Crea la evaluación y genera un `ExamenEvaluacion` por cada fila de la
     * matriz Cargo→Examen que aplique al cargo actual del colaborador y al
     * tipo de evaluación (HU-031/HU-034/HU-036). Si no hay matriz definida
     * para ese cargo, la evaluación queda creada sin exámenes — no es un
     * error, solo significa que SST aún no cargó la matriz para ese cargo;
     * en cualquier caso queda trazabilidad en `log_generacion_examenes`.
     *
     * `$fechaLimite` es el vencimiento propio de esta fila (HU-034/036): para
     * un Ingreso siempre es null (nunca vence); para un Periódico es el
     * `proximo_examen_fecha` que calculó la evaluación anterior terminada.
     */
    public function crear(Colaborador $colaborador, string $tipoEvaluacion, ?Carbon $fechaLimite = null): EvaluacionMedica
    {
        return DB::transaction(function () use ($colaborador, $tipoEvaluacion, $fechaLimite) {
            $numeroPeriodo = $tipoEvaluacion === 'periodico' ? $this->siguienteNumeroPeriodo($colaborador) : null;

            $evaluacion = EvaluacionMedica::create([
                'colaborador_id' => $colaborador->id,
                'tipo_evaluacion' => $tipoEvaluacion,
                'numero_periodo' => $numeroPeriodo,
                'fecha_evaluacion' => now()->toDateString(),
                'fecha_limite' => $fechaLimite?->toDateString(),
                'estado' => 'sin_iniciar',
            ]);

            $matriz = CargoExamen::where('cargo', $colaborador->cargo)
                ->where('tipo_evaluacion', $tipoEvaluacion)
                ->where('activo', true)
                ->get();

            foreach ($matriz as $fila) {
                $evaluacion->examenes()->create([
                    'examen_id' => $fila->examen_id,
                    'obligatorio' => $fila->obligatorio,
                    'origen' => 'matriz',
                    'estado' => 'pendiente',
                ]);
            }

            $this->registrarLogGeneracion($colaborador, $tipoEvaluacion, $matriz->count());

            return $evaluacion;
        });
    }

    private function siguienteNumeroPeriodo(Colaborador $colaborador): int
    {
        return 1 + (int) EvaluacionMedica::where('colaborador_id', $colaborador->id)
            ->where('tipo_evaluacion', 'periodico')
            ->max('numero_periodo');
    }

    private function registrarLogGeneracion(Colaborador $colaborador, string $tipoEvaluacion, int $examenesGenerados): void
    {
        LogGeneracionExamenes::create([
            'colaborador_id' => $colaborador->id,
            'fecha_evento' => now(),
            'resultado' => $examenesGenerados > 0 ? LogGeneracionExamenes::RESULTADO_OK : LogGeneracionExamenes::RESULTADO_SIN_MATRIZ,
            'detalle' => $examenesGenerados > 0
                ? "{$examenesGenerados} examen(es) generados desde la matriz para el cargo \"{$colaborador->cargo}\" ({$tipoEvaluacion})."
                : "Sin matriz definida para el cargo \"{$colaborador->cargo}\" y tipo \"{$tipoEvaluacion}\".",
        ]);
    }

    /**
     * Recalcula el estado de la evaluación (HU-059/060) y, si queda
     * Terminada, el próximo examen (HU-057/058). Si es Ingreso o Periódico y
     * queda Terminada por primera vez, además crea automáticamente el
     * siguiente Periódico (HU-034/036) — nunca duplica si ya existe. Se
     * llama después de cualquier cambio a sus exámenes (programar, ejecutar,
     * agregar adicional) o al concepto de aptitud.
     */
    public function recalcularEstado(EvaluacionMedica $evaluacion): void
    {
        $evaluacion->load('examenes');
        $obligatorios = $evaluacion->examenes->where('obligatorio', true);

        if ($obligatorios->isNotEmpty() && $obligatorios->every(fn ($e) => $e->estado === 'realizado')) {
            $yaEstabaTerminada = $evaluacion->estado === 'terminada';
            $datos = ['estado' => 'terminada'];
            $fechaMasReciente = $obligatorios->pluck('fecha_ejecucion')->filter()->max();

            if (in_array($evaluacion->tipo_evaluacion, ['ingreso', 'periodico'], true) && $fechaMasReciente) {
                $meses = (int) config('seguridad.examenes_medicos.periodicidad_meses');
                $proximo = Carbon::parse($fechaMasReciente)->addMonths($meses);
                $datos['proximo_examen_fecha'] = $proximo->toDateString();
                $datos['fecha_entrada_bandeja'] = $proximo->copy()->subMonth()->toDateString();
            }

            $evaluacion->update($datos);

            if (! $yaEstabaTerminada && isset($datos['proximo_examen_fecha'])) {
                $this->crearSiguientePeriodicoSiNoExiste($evaluacion, Carbon::parse($datos['proximo_examen_fecha']));
            }

            return;
        }

        $fechaLimite = $evaluacion->fecha_limite ?? $this->fechaLimiteHeredada($evaluacion);

        if ($fechaLimite && Carbon::today()->gt($fechaLimite)) {
            $evaluacion->update(['estado' => 'demorada']);

            return;
        }

        $enProceso = $obligatorios->contains(fn ($e) => $e->estado !== 'pendiente');
        $evaluacion->update(['estado' => $enProceso ? 'en_proceso' : 'sin_iniciar']);
    }

    /**
     * Respaldo para evaluaciones Periódicas creadas antes de que
     * `fecha_limite` quedara persistida en la propia fila (o creadas
     * directamente vía `crear()` sin ese dato) — mira hacia atrás la
     * evaluación Terminada más reciente del mismo colaborador.
     */
    private function fechaLimiteHeredada(EvaluacionMedica $evaluacion): ?Carbon
    {
        if ($evaluacion->tipo_evaluacion !== 'periodico') {
            return null;
        }

        $anterior = EvaluacionMedica::where('colaborador_id', $evaluacion->colaborador_id)
            ->where('id', '!=', $evaluacion->id)
            ->where('estado', 'terminada')
            ->whereNotNull('proximo_examen_fecha')
            ->latest('fecha_evaluacion')
            ->first();

        return $anterior?->proximo_examen_fecha;
    }

    private function crearSiguientePeriodicoSiNoExiste(EvaluacionMedica $anterior, Carbon $fechaLimite): void
    {
        $numeroSiguiente = $anterior->tipo_evaluacion === 'ingreso' ? 1 : ((int) $anterior->numero_periodo) + 1;

        $yaExiste = EvaluacionMedica::where('colaborador_id', $anterior->colaborador_id)
            ->where('tipo_evaluacion', 'periodico')
            ->where('numero_periodo', $numeroSiguiente)
            ->exists();

        if ($yaExiste) {
            return;
        }

        $this->crear($anterior->colaborador, 'periodico', $fechaLimite);
    }

    /**
     * Egreso (HU-037/038) es un flujo aparte: sin matriz de exámenes ni
     * periodicidad, solo el registro del examen de retiro del colaborador.
     * `fecha_limite`/`fecha_programacion` se derivan directamente de la
     * fecha fin del contrato (ver `sincronizarEgresoPorContrato`).
     */
    public function crearEgreso(Colaborador $colaborador, ?Carbon $fechaLimite = null): EvaluacionMedica
    {
        return EvaluacionMedica::create([
            'colaborador_id' => $colaborador->id,
            'tipo_evaluacion' => 'egreso',
            'fecha_evaluacion' => now()->toDateString(),
            'fecha_limite' => $fechaLimite?->toDateString(),
            'fecha_programacion' => $fechaLimite?->toDateString(),
            'estado' => 'pendiente',
        ]);
    }

    /**
     * Pendiente/Programado/Ejecutado, calculado a partir de la
     * fecha_programacion y fecha_examen_ejecutado propias de la evaluación
     * (Egreso no tiene ExamenEvaluacion — no hay matriz). Un rechazo
     * (HU-038) también cuenta como "ejecutado" — `tipo_cierre` distingue
     * cuál de los dos cerró el caso.
     */
    public function recalcularEstadoEgreso(EvaluacionMedica $evaluacion): void
    {
        $estado = match (true) {
            $evaluacion->fecha_examen_ejecutado !== null || $evaluacion->tipo_cierre === 'rechazado' => 'ejecutado',
            $evaluacion->fecha_programacion !== null => 'programado',
            default => 'pendiente',
        };

        $evaluacion->update(['estado' => $estado]);
    }

    /**
     * HU-038: el colaborador rechaza el examen de egreso. No puede coexistir
     * con un cierre "por examen" — `tipo_cierre` es una u otra condición.
     */
    public function rechazarEgreso(EvaluacionMedica $evaluacion, string $observacion): void
    {
        $evaluacion->update([
            'tipo_cierre' => 'rechazado',
            'fecha_rechazo' => now()->toDateString(),
            'observacion_rechazo' => $observacion,
        ]);

        $this->recalcularEstadoEgreso($evaluacion);
    }

    /**
     * HU-030/035/041: cantidades requerida/ejecutada/pendiente y la alerta
     * de vencimiento, calculadas en tiempo de consulta — nunca se persisten
     * como estado (regla de negocio). Egreso no tiene exámenes hijos, así
     * que cuenta como un único "examen" requerido. Reutilizado por la
     * bandeja (`EvaluacionMedicaController::index`) y por la exportación a
     * Excel para que ambas coincidan exactamente (CA-041.6).
     *
     * @return array{cantidad_requerida: int, cantidad_ejecutada: int, cantidad_pendiente: int, dias_restantes: ?int, alerta: ?string}
     */
    public function indicadoresBandeja(EvaluacionMedica $evaluacion): array
    {
        $esEgreso = $evaluacion->tipo_evaluacion === 'egreso';
        $completada = in_array($evaluacion->estado, ['terminada', 'ejecutado'], true);

        $requerida = $esEgreso
            ? 1
            : (int) ($evaluacion->cantidad_requerida_examenes ?? $evaluacion->examenes()->count());
        $ejecutada = $esEgreso
            ? ($completada ? 1 : 0)
            : (int) ($evaluacion->cantidad_ejecutada_examenes ?? $evaluacion->examenes()->where('estado', 'realizado')->count());

        $diasRestantes = null;
        $alerta = null;

        if (! $completada && $evaluacion->fecha_limite) {
            $limite = Carbon::parse($evaluacion->fecha_limite)->startOfDay();
            $diasRestantes = (int) round(($limite->timestamp - Carbon::today()->timestamp) / 86400);
            $alerta = match (true) {
                $diasRestantes < 0 => 'vencido',
                $diasRestantes <= 30 => 'proximo_a_vencer',
                default => null,
            };
        }

        return [
            'cantidad_requerida' => $requerida,
            'cantidad_ejecutada' => $ejecutada,
            'cantidad_pendiente' => max(0, $requerida - $ejecutada),
            'dias_restantes' => $diasRestantes,
            'alerta' => $alerta,
        ];
    }

    /**
     * HU-037: crea (si no existía) o sincroniza la evaluación de Egreso del
     * colaborador con la fecha fin de su contrato. No toca una evaluación
     * que ya se cerró (ejecutada o rechazada) — solo mientras sigue
     * pendiente/programada, para no revivir un caso ya resuelto.
     */
    public function sincronizarEgresoPorContrato(Colaborador $colaborador, Carbon $fechaFin): void
    {
        $evaluacion = EvaluacionMedica::where('colaborador_id', $colaborador->id)
            ->where('tipo_evaluacion', 'egreso')
            ->first();

        if (! $evaluacion) {
            $this->crearEgreso($colaborador, $fechaFin);

            return;
        }

        if (in_array($evaluacion->estado, ['pendiente', 'programado'], true)) {
            $evaluacion->update([
                'fecha_limite' => $fechaFin->toDateString(),
                'fecha_programacion' => $fechaFin->toDateString(),
            ]);
            $this->recalcularEstadoEgreso($evaluacion);
        }
    }
}
