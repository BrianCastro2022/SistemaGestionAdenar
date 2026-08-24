<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Models\Seguridad\Aci;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AciController extends Controller
{
    public function index(Request $request): Response
    {
        $filtros = $request->only(['folio', 'mes', 'anio', 'colaborador', 'area', 'tipo_riesgo', 'centro']);

        $acis = Aci::query()
            ->with('colaborador:id,nombres,apellidos,cedula,centro')
            ->when($filtros['folio'] ?? null, fn ($query, $folio) => $query->where('folio', 'like', "%{$folio}%"))
            ->when($filtros['mes'] ?? null, fn ($query, $mes) => $query->whereMonth('fecha_incidente', $mes))
            ->when($filtros['anio'] ?? null, fn ($query, $anio) => $query->whereYear('fecha_incidente', $anio))
            ->when($filtros['area'] ?? null, fn ($query, $area) => $query->where('area', $area))
            ->when($filtros['tipo_riesgo'] ?? null, fn ($query, $tipo) => $query->where('tipo_riesgo', 'like', "%{$tipo}%"))
            ->when(
                $filtros['colaborador'] ?? null,
                fn ($query, $texto) => $query->whereHas('colaborador', function ($q) use ($texto) {
                    $q->where('nombres', 'like', "%{$texto}%")
                        ->orWhere('apellidos', 'like', "%{$texto}%")
                        ->orWhere('cedula', 'like', "%{$texto}%")
                        ->orWhere('codigo_qr_skap', 'like', "%{$texto}%");
                }),
            )
            ->when(
                $filtros['centro'] ?? null,
                fn ($query, $centro) => $query->whereHas('colaborador', fn ($q) => $q->where('centro', $centro)),
            )
            ->latest('fecha_incidente')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('seguridad/acis/index', [
            'acis' => $acis,
            'filters' => $filtros,
            'catalogos' => [
                'areas' => config('seguridad.acis.areas'),
                'centros' => config('seguridad.colaboradores.centros'),
            ],
        ]);
    }

    public function show(Aci $aci): Response
    {
        $aci->load(['colaborador', 'asignador', 'asignado']);

        return Inertia::render('seguridad/acis/show', [
            'aci' => $aci,
        ]);
    }
}
