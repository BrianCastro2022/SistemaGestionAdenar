<?php

namespace App\Http\Controllers\Colaborador;

use App\Http\Controllers\Controller;
use App\Models\Seguridad\Colaborador;
use App\Services\Seguridad\EvaluacionCalculator;
use App\Services\Seguridad\IndiceRiesgoCalculator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalController extends Controller
{
    public function index(Request $request, EvaluacionCalculator $evaluacion, IndiceRiesgoCalculator $riesgo): Response
    {
        $colaborador = $this->colaboradorDe($request);

        if (! $colaborador) {
            return Inertia::render('colaborador/sin-vincular');
        }

        return Inertia::render('dashboard/colaborador', [
            'colaborador' => [
                'id' => $colaborador->id,
                'nombre_completo' => $colaborador->nombre_completo,
                'cargo' => $colaborador->cargo,
                'turno' => $colaborador->turno,
                'area' => $colaborador->area,
                'imagen' => $colaborador->imagen,
            ],
            'estadoHoy' => $evaluacion->paraColaboradorHoy($colaborador),
            'jornadaAbierta' => $evaluacion->faltaRegistrarSalida($colaborador),
            'indiceRiesgo' => $riesgo->calcular($colaborador),
            'ultimasPruebas' => $colaborador->pruebasAlcoholemia()
                ->with('alcoholimetro:id,codigo')
                ->latest('fecha_hora')
                ->limit(5)
                ->get(),
            'ultimasCondiciones' => $colaborador->condicionesSalud()
                ->latest('fecha_hora')
                ->limit(5)
                ->get(),
            'alertasPendientes' => $colaborador->alertas()->where('atendida', false)->count(),
            'asignacionConductor' => $colaborador->asignacionesConductor()->latest('id')->first(),
        ]);
    }

    public function perfil(Request $request): Response
    {
        $colaborador = $this->colaboradorDeOFallar($request);

        return Inertia::render('colaborador/perfil', [
            'colaborador' => $colaborador,
        ]);
    }

    public function pruebas(Request $request): Response
    {
        $colaborador = $this->colaboradorDeOFallar($request);

        return Inertia::render('colaborador/pruebas', [
            'pruebas' => $colaborador->pruebasAlcoholemia()
                ->with('alcoholimetro:id,codigo')
                ->latest('fecha_hora')
                ->paginate(15),
        ]);
    }

    public function rutas(Request $request): Response
    {
        $colaborador = $this->colaboradorDeOFallar($request);

        return Inertia::render('colaborador/rutas', [
            'asignaciones' => $colaborador->asignacionesConductor()->latest('id')->get(),
        ]);
    }

    public function alertas(Request $request): Response
    {
        $colaborador = $this->colaboradorDeOFallar($request);

        return Inertia::render('colaborador/alertas', [
            'alertas' => $colaborador->alertas()->latest()->paginate(15),
        ]);
    }

    private function colaboradorDe(Request $request): ?Colaborador
    {
        return $request->user()->colaborador;
    }

    private function colaboradorDeOFallar(Request $request): Colaborador
    {
        return $this->colaboradorDe($request) ?? abort(
            403,
            'Tu cuenta todavía no está vinculada a un registro de colaborador. Contacta a un administrador.'
        );
    }
}
