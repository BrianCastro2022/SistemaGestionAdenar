<?php

namespace App\Http\Controllers\Gente;

use App\Http\Controllers\Controller;
use App\Models\GeovictoriaAsistencia;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GeovictoriaAsistenciaController extends Controller
{
    /**
     * Solo lectura: estos datos los genera la automatización GeoVictoria
     * que corre en una PC local (ver POST /api/geovictoria/asistencias),
     * no se crean/editan desde la web.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $grupo = $request->string('grupo')->trim()->toString();
        $cargo = $request->string('cargo')->trim()->toString();
        $tipo = $request->string('tipo')->trim()->toString();
        $fechaDesde = $request->string('fecha_desde')->trim()->toString();
        $fechaHasta = $request->string('fecha_hasta')->trim()->toString();

        $registros = GeovictoriaAsistencia::query()
            ->when($search !== '', fn ($query) => $query->where(fn ($q) => $q
                ->where('identificador', 'like', "%{$search}%")
                ->orWhere('nombres', 'like', "%{$search}%")
                ->orWhere('apellidos', 'like', "%{$search}%")))
            ->when($grupo !== '', fn ($query) => $query->where('grupo', $grupo))
            ->when($cargo !== '', fn ($query) => $query->where('cargo', $cargo))
            ->when($tipo === 'exceso_jornada', fn ($query) => $query->where('exceso_jornada', true))
            ->when($tipo === 'descanso_no_efectivo', fn ($query) => $query->where('descanso_no_efectivo', true))
            ->when($fechaDesde !== '', fn ($query) => $query->whereDate('fecha', '>=', $fechaDesde))
            ->when($fechaHasta !== '', fn ($query) => $query->whereDate('fecha', '<=', $fechaHasta))
            ->orderByDesc('fecha')
            ->orderBy('apellidos')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('gente/geovictoria-asistencia/index', [
            'registros' => $registros,
            'filters' => [
                'search' => $search,
                'grupo' => $grupo,
                'cargo' => $cargo,
                'tipo' => $tipo,
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
            ],
            'opciones' => [
                'grupos' => $this->valoresDistintos('grupo'),
                'cargos' => $this->valoresDistintos('cargo'),
            ],
            'indicadores' => [
                'resumen' => $this->resumen(),
                'tendencia_diaria' => $this->tendenciaDiaria(),
                'top_empleados' => $this->topEmpleadosConIncidencias(),
            ],
        ]);
    }

    private function valoresDistintos(string $columna): array
    {
        return GeovictoriaAsistencia::query()
            ->whereNotNull($columna)
            ->where($columna, '!=', '')
            ->pluck($columna)
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    private function resumen(): array
    {
        $total = GeovictoriaAsistencia::count();
        $conExceso = GeovictoriaAsistencia::where('exceso_jornada', true)->count();
        $conDescanso = GeovictoriaAsistencia::where('descanso_no_efectivo', true)->count();
        $empleados = GeovictoriaAsistencia::query()->distinct()->count('identificador');

        return [
            'total_registros' => $total,
            'empleados' => $empleados,
            'pct_exceso_jornada' => $total > 0 ? round($conExceso * 100 / $total, 1) : 0,
            'pct_descanso_no_efectivo' => $total > 0 ? round($conDescanso * 100 / $total, 1) : 0,
            'promedio_horas_trabajadas' => $this->promedioHorasTrabajadas(),
        ];
    }

    /**
     * 'horas_trabajadas' llega como texto "HH:MM" desde el reporte de
     * GeoVictoria (columna HT), no como un intervalo de tipo de dato en la
     * base, así que el promedio se calcula en PHP convirtiendo a minutos.
     */
    private function promedioHorasTrabajadas(): ?string
    {
        $minutos = GeovictoriaAsistencia::query()
            ->whereNotNull('horas_trabajadas')
            ->where('horas_trabajadas', '!=', '')
            ->pluck('horas_trabajadas')
            ->map(function (string $valor) {
                if (! preg_match('/^(-?)(\d{1,3}):(\d{2})/', $valor, $m)) {
                    return null;
                }

                $signo = $m[1] === '-' ? -1 : 1;

                return $signo * ((int) $m[2] * 60 + (int) $m[3]);
            })
            ->filter(fn ($valor) => $valor !== null);

        if ($minutos->isEmpty()) {
            return null;
        }

        $promedio = (int) round($minutos->avg());
        $signo = $promedio < 0 ? '-' : '';
        $promedio = abs($promedio);

        return sprintf('%s%02d:%02d', $signo, intdiv($promedio, 60), $promedio % 60);
    }

    /**
     * Incidencias por día en los últimos 30 días (para el stacked bar de
     * tendencia). Se agrupa en PHP en vez de con funciones de fecha de SQL
     * para que el resultado sea igual en MySQL (producción) y sqlite
     * (tests), y se rellenan los días sin datos.
     */
    private function tendenciaDiaria(): array
    {
        $desde = CarbonImmutable::now()->subDays(29)->startOfDay();

        $porDia = GeovictoriaAsistencia::query()
            ->where('fecha', '>=', $desde->toDateString())
            ->where(fn ($query) => $query->where('exceso_jornada', true)->orWhere('descanso_no_efectivo', true))
            ->get(['fecha', 'exceso_jornada', 'descanso_no_efectivo'])
            ->groupBy(fn (GeovictoriaAsistencia $registro) => $registro->fecha->format('Y-m-d'));

        $dias = [];
        for ($fecha = $desde; $fecha <= CarbonImmutable::now(); $fecha = $fecha->addDay()) {
            $clave = $fecha->format('Y-m-d');
            $delDia = $porDia->get($clave, collect());

            $dias[] = [
                'fecha' => $clave,
                'exceso_jornada' => $delDia->where('exceso_jornada', true)->count(),
                'descanso_no_efectivo' => $delDia->where('descanso_no_efectivo', true)->count(),
            ];
        }

        return $dias;
    }

    /**
     * Empleados con más días de incidencia (exceso de jornada o descanso
     * no efectivo) en todo el histórico, no solo el corte actual.
     */
    private function topEmpleadosConIncidencias(): array
    {
        return GeovictoriaAsistencia::query()
            ->where(fn ($query) => $query->where('exceso_jornada', true)->orWhere('descanso_no_efectivo', true))
            ->select(
                'identificador',
                DB::raw('MAX(nombres) as nombres'),
                DB::raw('MAX(apellidos) as apellidos'),
                DB::raw('SUM(CASE WHEN exceso_jornada THEN 1 ELSE 0 END) as total_exceso_jornada'),
                DB::raw('SUM(CASE WHEN descanso_no_efectivo THEN 1 ELSE 0 END) as total_descanso_no_efectivo'),
            )
            ->groupBy('identificador')
            ->orderByDesc(DB::raw('SUM(CASE WHEN exceso_jornada THEN 1 ELSE 0 END) + SUM(CASE WHEN descanso_no_efectivo THEN 1 ELSE 0 END)'))
            ->limit(10)
            ->get()
            ->map(fn ($fila) => [
                'identificador' => $fila->identificador,
                'nombre' => trim("{$fila->nombres} {$fila->apellidos}"),
                'total_exceso_jornada' => (int) $fila->total_exceso_jornada,
                'total_descanso_no_efectivo' => (int) $fila->total_descanso_no_efectivo,
            ])
            ->all();
    }
}
