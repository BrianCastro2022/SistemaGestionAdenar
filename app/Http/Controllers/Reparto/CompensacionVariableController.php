<?php

namespace App\Http\Controllers\Reparto;

use App\Http\Controllers\Controller;
use App\Models\Reparto\CompensacionVariable;
use App\Services\Reparto\CompensacionVariableImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CompensacionVariableController extends Controller
{
    public function index(Request $request): Response
    {
        $query = CompensacionVariable::query();

        // 9 Base Filters
        if ($request->filled('anio')) {
            $query->where('anio', (int) $request->input('anio'));
        }
        if ($request->filled('mes')) {
            $query->where('mes', $request->input('mes'));
        }
        if ($request->filled('regional')) {
            $query->where('regional', $request->input('regional'));
        }
        if ($request->filled('cd')) {
            $query->where('cd', $request->input('cd'));
        }
        if ($request->filled('cargo')) {
            $query->where('cargo', $request->input('cargo'));
        }
        if ($request->filled('codigo_ob')) {
            $query->where('codigo_ob', 'like', '%' . trim($request->input('codigo_ob')) . '%');
        }
        if ($request->filled('codigo_gp')) {
            $query->where('codigo_gp', 'like', '%' . trim($request->input('codigo_gp')) . '%');
        }
        if ($request->filled('identificador')) {
            $query->where('identificador', 'like', '%' . trim($request->input('identificador')) . '%');
        }
        if ($request->filled('nombre')) {
            $query->where('nombre', 'like', '%' . trim($request->input('nombre')) . '%');
        }

        // Dynamic Select Performance Filters
        if ($request->filled('ausencia_justificada')) {
            $query->where('ausencia_justificada', (float) $request->input('ausencia_justificada'));
        }
        if ($request->filled('ausencia_injustificada')) {
            $query->where('ausencia_injustificada', (float) $request->input('ausencia_injustificada'));
        }
        if ($request->filled('tri_fatalidades')) {
            $query->where('tri_fatalidades', (float) $request->input('tri_fatalidades'));
        }
        if ($request->filled('adherencia_gp')) {
            $query->where('adherencia_gp', $request->input('adherencia_gp'));
        }
        if ($request->filled('habilitadores')) {
            $query->where('habilitadores', (float) $request->input('habilitadores'));
        }
        if ($request->filled('market_refusals')) {
            $query->where('market_refusals', $request->input('market_refusals'));
        }
        if ($request->filled('variable')) {
            $query->where('variable', $request->input('variable'));
        }

        $data = (clone $query)->latest('id')->paginate(20)->withQueryString();

        // Base query for stats
        $baseQuery = clone $query;

        // Parse numerical value from string formats like "95%" or "3 POCs"
        $rawRecords = (clone $baseQuery)->get(['adherencia_gp', 'market_refusals']);

        $sumAdherencia = 0;
        $countAdherencia = 0;
        foreach ($rawRecords as $rec) {
            if ($rec->adherencia_gp !== null && $rec->adherencia_gp !== '') {
                $val = (float) preg_replace('/[^0-9\.]/', '', str_replace(',', '.', $rec->adherencia_gp));
                $sumAdherencia += $val;
                $countAdherencia++;
            }
        }

        $sumRefusals = 0;
        $countRefusals = 0;
        foreach ($rawRecords as $rec) {
            if ($rec->market_refusals !== null && $rec->market_refusals !== '') {
                $val = (float) preg_replace('/[^0-9\.]/', '', str_replace(',', '.', $rec->market_refusals));
                $sumRefusals += $val;
                $countRefusals++;
            }
        }

        $indicadores = [
            'total_registros' => (clone $baseQuery)->count(),
            'prom_rechazos' => round((float) (clone $baseQuery)->avg('porcentaje_rechazos'), 2),
            'prom_adherencia_gp' => $countAdherencia > 0 ? round($sumAdherencia / $countAdherencia, 1) : 0,
            'prom_market_refusals' => $countRefusals > 0 ? round($sumRefusals / $countRefusals, 1) : 0,
            'habilitador_1' => (clone $baseQuery)->where('habilitadores', '>=', 1)->count(),
            'habilitador_08' => (clone $baseQuery)->whereBetween('habilitadores', [0.75, 0.95])->count(),
            'habilitador_0' => (clone $baseQuery)->where('habilitadores', '<', 0.75)->count(),
            'total_salario_variable' => (float) (clone $baseQuery)->sum('salario_variable'),
            'total_pago_variable_dt' => (float) (clone $baseQuery)->sum('pago_variable_dt'),
            'prom_dias' => round((float) (clone $baseQuery)->avg('dias_trabajados'), 1),
        ];

        $catalogos = [
            'anios' => CompensacionVariable::distinct()->whereNotNull('anio')->pluck('anio')->sort()->values(),
            'meses' => CompensacionVariable::distinct()->whereNotNull('mes')->where('mes', '!=', '')->pluck('mes')->sort()->values(),
            'regionales' => CompensacionVariable::distinct()->whereNotNull('regional')->where('regional', '!=', '')->pluck('regional')->sort()->values(),
            'cds' => CompensacionVariable::distinct()->whereNotNull('cd')->where('cd', '!=', '')->pluck('cd')->sort()->values(),
            'cargos' => CompensacionVariable::distinct()->whereNotNull('cargo')->where('cargo', '!=', '')->pluck('cargo')->sort()->values(),
            'codigos_ob' => CompensacionVariable::distinct()->whereNotNull('codigo_ob')->where('codigo_ob', '!=', '')->pluck('codigo_ob')->sort()->values(),
            'codigos_gp' => CompensacionVariable::distinct()->whereNotNull('codigo_gp')->where('codigo_gp', '!=', '')->pluck('codigo_gp')->sort()->values(),
            'identificadores' => CompensacionVariable::distinct()->whereNotNull('identificador')->where('identificador', '!=', '')->pluck('identificador')->sort()->values(),
            'nombres' => CompensacionVariable::distinct()->whereNotNull('nombre')->where('nombre', '!=', '')->pluck('nombre')->sort()->values(),

            // Dynamic Select catalogs from current DB values
            'ausencias_justificadas' => CompensacionVariable::distinct()->whereNotNull('ausencia_justificada')->pluck('ausencia_justificada')->sort()->values(),
            'ausencias_injustificadas' => CompensacionVariable::distinct()->whereNotNull('ausencia_injustificada')->pluck('ausencia_injustificada')->sort()->values(),
            'tri_fatalidades' => CompensacionVariable::distinct()->whereNotNull('tri_fatalidades')->pluck('tri_fatalidades')->sort()->values(),
            'adherencias_gp' => CompensacionVariable::distinct()->whereNotNull('adherencia_gp')->where('adherencia_gp', '!=', '')->pluck('adherencia_gp')->sort()->values(),
            'habilitadores' => CompensacionVariable::distinct()->whereNotNull('habilitadores')->pluck('habilitadores')->sort()->values(),
            'market_refusals' => CompensacionVariable::distinct()->whereNotNull('market_refusals')->where('market_refusals', '!=', '')->pluck('market_refusals')->sort()->values(),
            'variables' => CompensacionVariable::distinct()->whereNotNull('variable')->where('variable', '!=', '')->pluck('variable')->sort()->values(),
        ];

        return Inertia::render('reparto/compensacion-variable/index', [
            'data' => $data,
            'indicadores' => $indicadores,
            'filters' => $request->only([
                'anio', 'mes', 'regional', 'cd', 'cargo',
                'codigo_ob', 'codigo_gp', 'identificador', 'nombre',
                'ausencia_justificada', 'ausencia_injustificada', 'tri_fatalidades',
                'adherencia_gp', 'habilitadores', 'market_refusals', 'variable'
            ]),
            'catalogos' => $catalogos,
        ]);
    }

    public function importar(Request $request, CompensacionVariableImportService $service): RedirectResponse
    {
        $request->validate([
            'archivos' => 'required|array|min:1',
            'archivos.*' => 'required|file|mimes:xlsx,xls,csv|max:20480',
        ]);

        $rutas = collect($request->file('archivos'))
            ->mapWithKeys(fn ($archivo) => [$archivo->getRealPath() => $archivo->getClientOriginalName()])
            ->all();

        $resultado = $service->importar($rutas);

        if ($resultado['registros_creados'] > 0) {
            $mensaje = "Excel procesado exitosamente: Se cargaron {$resultado['registros_creados']} filas correspondientes a {$resultado['colaboradores_unicos']} colaboradores únicos ({$resultado['colaboradores_encontrados']} identificaciones vinculadas en el módulo de Colaboradores).";
            $tipo = 'success';
        } else {
            $mensaje = "No se pudieron procesar los datos del archivo. Verifique el formato y encabezados.";
            $tipo = 'error';
        }

        return redirect()->route('reparto.compensacion-variable.index')
            ->with('status', ['message' => $mensaje, 'type' => $tipo]);
    }

    public function detalle(string $identificador): JsonResponse
    {
        $registros = CompensacionVariable::where('identificador', $identificador)
            ->orWhere('id', $identificador)
            ->get();

        if ($registros->isEmpty()) {
            return response()->json(['error' => 'Registro no encontrado'], 404);
        }

        $principal = $registros->first();
        $totalPagado = $registros->sum('pago_variable_dt');
        $promHabilitador = $registros->avg('habilitadores');
        $ausJust = $registros->sum('ausencia_justificada');
        $ausInjust = $registros->sum('ausencia_injustificada');

        return response()->json([
            'colaborador' => [
                'identificador' => $principal->identificador,
                'nombre' => $principal->nombre,
                'cargo' => $principal->cargo,
                'codigo_ob' => $principal->codigo_ob,
                'codigo_gp' => $principal->codigo_gp,
                'regional' => $principal->regional,
                'cd' => $principal->cd,
            ],
            'registros' => $registros,
            'acumulado_mensual' => [
                'salario_variable_base' => $registros->sum('salario_variable'),
                'pago_variable_dt' => $totalPagado,
                'dias_trabajados' => $registros->sum('dias_trabajados'),
                'ausencias_justificadas' => $ausJust,
                'ausencias_injustificadas' => $ausInjust,
                'tri_fatalidades' => $registros->sum('tri_fatalidades'),
            ],
            'habilitador_final' => round($promHabilitador, 2),
        ]);
    }

    public function limpiar(): RedirectResponse
    {
        CompensacionVariable::truncate();

        return redirect()->route('reparto.compensacion-variable.index')
            ->with('status', ['message' => 'Se han limpiado todos los datos de compensación variable.', 'type' => 'success']);
    }

    public function exportar(Request $request): StreamedResponse
    {
        $query = CompensacionVariable::query();

        if ($request->filled('anio')) $query->where('anio', (int) $request->input('anio'));
        if ($request->filled('mes')) $query->where('mes', $request->input('mes'));
        if ($request->filled('regional')) $query->where('regional', $request->input('regional'));
        if ($request->filled('cd')) $query->where('cd', $request->input('cd'));
        if ($request->filled('cargo')) $query->where('cargo', $request->input('cargo'));
        if ($request->filled('codigo_ob')) $query->where('codigo_ob', 'like', '%' . trim($request->input('codigo_ob')) . '%');
        if ($request->filled('codigo_gp')) $query->where('codigo_gp', 'like', '%' . trim($request->input('codigo_gp')) . '%');
        if ($request->filled('identificador')) $query->where('identificador', 'like', '%' . trim($request->input('identificador')) . '%');
        if ($request->filled('nombre')) $query->where('nombre', 'like', '%' . trim($request->input('nombre')) . '%');

        if ($request->filled('ausencia_justificada')) $query->where('ausencia_justificada', (float) $request->input('ausencia_justificada'));
        if ($request->filled('ausencia_injustificada')) $query->where('ausencia_injustificada', (float) $request->input('ausencia_injustificada'));
        if ($request->filled('tri_fatalidades')) $query->where('tri_fatalidades', (float) $request->input('tri_fatalidades'));
        if ($request->filled('adherencia_gp')) $query->where('adherencia_gp', $request->input('adherencia_gp'));
        if ($request->filled('habilitadores')) $query->where('habilitadores', (float) $request->input('habilitadores'));
        if ($request->filled('market_refusals')) $query->where('market_refusals', $request->input('market_refusals'));
        if ($request->filled('variable')) $query->where('variable', $request->input('variable'));

        $filename = 'compensacion_variable_' . date('Y-m-d_H-i') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($query) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($file, [
                'Código', 'Nombre', 'Cargo', 'Código OB', 'Código GP', 'Identificador',
                'Ausencias Justificadas', 'Ausencias Injustificadas', 'TRI/Fatalidades',
                'Adherencia GP', 'Market Refusals (POCs)', '% Rechazos', 'Habilitadores',
                'Variable', 'Días Trabajados', 'Salario Variable', 'Pago Variable DT'
            ]);

            $query->chunk(200, function ($rows) use ($file) {
                foreach ($rows as $r) {
                    fputcsv($file, [
                        $r->id, $r->nombre, $r->cargo, $r->codigo_ob, $r->codigo_gp,
                        $r->identificador, $r->ausencia_justificada, $r->ausencia_injustificada,
                        $r->tri_fatalidades, $r->adherencia_gp, $r->market_refusals,
                        $r->porcentaje_rechazos, $r->habilitadores, $r->variable,
                        $r->dias_trabajados, $r->salario_variable, $r->pago_variable_dt
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
