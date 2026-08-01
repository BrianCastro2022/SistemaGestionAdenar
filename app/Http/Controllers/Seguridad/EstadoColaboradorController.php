<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Models\Seguridad\Colaborador;
use App\Services\Seguridad\EvaluacionCalculator;
use Inertia\Inertia;
use Inertia\Response;

class EstadoColaboradorController extends Controller
{
    /**
     * HU047: indicador en tiempo real (refrescado por polling en el frontend)
     * con el estado de hoy de cada colaborador. HU034: agrupa las novedades
     * del día por turno a partir de esos mismos estados.
     */
    public function index(EvaluacionCalculator $calculator): Response
    {
        $colaboradores = Colaborador::query()
            ->where('is_active', true)
            ->orderBy('nombres')
            ->get()
            ->map(function (Colaborador $colaborador) use ($calculator) {
                $estado = $calculator->paraColaboradorHoy($colaborador);

                return [
                    'id' => $colaborador->id,
                    'nombre' => $colaborador->nombre_completo,
                    'turno' => $colaborador->turno,
                    'estado' => $estado,
                ];
            });

        $resumen = [
            'apto' => $colaboradores->where('estado', 'Apto')->count(),
            'observacion' => $colaboradores->where('estado', 'Apto con Observaciones')->count(),
            'no_apto' => $colaboradores->where('estado', 'No Apto')->count(),
            'sin_evaluar' => $colaboradores->whereNull('estado')->count(),
        ];

        $novedades = $colaboradores
            ->filter(fn (array $c) => in_array($c['estado'], ['Apto con Observaciones', 'No Apto'], true))
            ->groupBy(fn (array $c) => $c['turno'] ?? 'sin_turno')
            ->map(fn ($grupo) => $grupo->values());

        return Inertia::render('seguridad/indicador/index', [
            'colaboradores' => $colaboradores,
            'resumen' => $resumen,
            'novedadesPorTurno' => $novedades,
        ]);
    }
}
