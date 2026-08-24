<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Models\Seguridad\Alerta;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AlertaController extends Controller
{
    public function index(Request $request): Response
    {
        $estado = $request->string('estado', 'pendientes')->toString();

        $alertas = Alerta::query()
            ->with(['colaborador:id,nombres,apellidos', 'alcoholimetro:id,codigo'])
            ->when($estado === 'pendientes', fn ($query) => $query->where('atendida', false))
            ->when($estado === 'atendidas', fn ($query) => $query->where('atendida', true))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('seguridad/alertas/index', [
            'alertas' => $alertas,
            'filters' => ['estado' => $estado],
        ]);
    }

    public function atender(Request $request, Alerta $alerta): RedirectResponse
    {
        $alerta->update([
            'atendida' => true,
            'atendida_por' => $request->user()->id,
            'atendida_en' => Carbon::now(),
        ]);

        return back()->with('status', 'Alerta marcada como atendida.');
    }
}
