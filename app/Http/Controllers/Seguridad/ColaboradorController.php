<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seguridad\StoreColaboradorRequest;
use App\Http\Requests\Seguridad\UpdateColaboradorRequest;
use App\Models\Seguridad\Colaborador;
use App\Services\Seguridad\IndiceRiesgoCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ColaboradorController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $turno = $request->string('turno')->trim()->toString();

        $colaboradores = Colaborador::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('cedula', 'like', "%{$search}%");
                });
            })
            ->when($turno !== '', fn ($query) => $query->where('turno', $turno))
            ->orderBy('nombres')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('seguridad/colaboradores/index', [
            'colaboradores' => $colaboradores,
            'filters' => ['search' => $search, 'turno' => $turno],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('seguridad/colaboradores/create');
    }

    public function store(StoreColaboradorRequest $request): RedirectResponse
    {
        Colaborador::create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return to_route('seguridad.colaboradores.index')->with('status', 'Colaborador creado correctamente.');
    }

    public function show(Colaborador $colaborador, IndiceRiesgoCalculator $calculator): Response
    {
        return Inertia::render('seguridad/colaboradores/show', [
            'colaborador' => $colaborador,
            'indiceRiesgo' => $calculator->calcular($colaborador),
            'pruebas' => $colaborador->pruebasAlcoholemia()
                ->with('alcoholimetro:id,codigo')
                ->latest('fecha_hora')
                ->limit(25)
                ->get(),
            'condicionesSalud' => $colaborador->condicionesSalud()
                ->latest('fecha_hora')
                ->limit(25)
                ->get(),
        ]);
    }

    public function edit(Colaborador $colaborador): Response
    {
        return Inertia::render('seguridad/colaboradores/edit', [
            'colaborador' => $colaborador,
        ]);
    }

    public function update(UpdateColaboradorRequest $request, Colaborador $colaborador): RedirectResponse
    {
        $colaborador->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return to_route('seguridad.colaboradores.index')->with('status', 'Colaborador actualizado correctamente.');
    }

    public function destroy(Colaborador $colaborador): RedirectResponse
    {
        $colaborador->delete();

        return to_route('seguridad.colaboradores.index')->with('status', 'Colaborador eliminado correctamente.');
    }
}
