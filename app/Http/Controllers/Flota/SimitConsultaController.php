<?php

namespace App\Http\Controllers\Flota;

use App\Http\Controllers\Controller;
use App\Models\SimitConsulta;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class SimitConsultaController extends Controller
{
    /**
     * Solo lectura: estos datos los genera la automatización SIMIT que
     * corre en una PC local (ver POST /api/simit/consultas), no se
     * crean/editan desde la web.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $fechaDesde = $request->string('fecha_desde')->trim()->toString();
        $fechaHasta = $request->string('fecha_hasta')->trim()->toString();

        $consultas = SimitConsulta::query()
            ->when($search !== '', fn ($query) => $query->where('placa', 'like', "%{$search}%"))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($fechaDesde !== '', fn ($query) => $query->whereDate('fecha_hora', '>=', $fechaDesde))
            ->when($fechaHasta !== '', fn ($query) => $query->whereDate('fecha_hora', '<=', $fechaHasta))
            ->orderByDesc('fecha_hora')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('flota/simit-consultas/index', [
            'consultas' => $consultas,
            'actuales' => $this->estadoActual(),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
            ],
        ]);
    }

    /**
     * Una fila por placa: su consulta más reciente. Equivalente a lo que
     * el script local guarda en data/{placa}_ultimo.json, separado del
     * histórico completo (data/historico.csv).
     */
    private function estadoActual(): Collection
    {
        return SimitConsulta::query()
            ->whereIn('id', function ($query) {
                $query->selectRaw('MAX(id)')->from('simit_consultas')->groupBy('placa');
            })
            ->orderBy('placa')
            ->get();
    }

    /**
     * Sirve el pantallazo (guardado como BLOB, no como archivo en disco)
     * para mostrarlo/descargarlo desde la vista.
     */
    public function screenshot(SimitConsulta $consulta): HttpResponse
    {
        abort_if(! $consulta->screenshot, 404);

        return response($consulta->screenshot, 200, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'inline; filename="'.($consulta->screenshot_nombre ?: 'pantallazo.png').'"',
        ]);
    }
}
