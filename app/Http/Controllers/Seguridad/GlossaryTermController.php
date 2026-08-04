<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seguridad\StoreGlossaryTermRequest;
use App\Models\Seguridad\GlossaryTerm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GlossaryTermController extends Controller
{
    // Categorías disponibles - centralizar aquí
    private const CATEGORIES = [
        'SEÑALIZACIÓN DE LA VÍA',
        'CONDICIONES DEL PAVIMENTO',
        'VISIBILIDAD Y CLIMA',
        'COMPORTAMIENTO DEL CONDUCTOR',
        'ESTADO DEL VEHÍCULO',
        'SEÑALES DE TRÁNSITO',
    ];

    public function index(Request $request): Response
    {
        $search = $request->string('search', '')->toString();
        $categoria = $request->string('categoria', '')->toString();

        $terms = GlossaryTerm::query()
            ->when($search, fn ($query) => $query->search($search))
            ->when($categoria, fn ($query) => $query->byCategory($categoria))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('seguridad/glosario/index', [
            'terms' => $terms,
            'filters' => [
                'search' => $search,
                'categoria' => $categoria,
            ],
            'categories' => self::CATEGORIES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('seguridad/glosario/create', [
            'categories' => self::CATEGORIES,
        ]);
    }

    public function store(StoreGlossaryTermRequest $request): RedirectResponse
    {
        GlossaryTerm::create([
            ...$request->validated(),
            'source' => 'manual',
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('seguridad.glosario.index')
            ->with('status', 'Término agregado exitosamente.');
    }

    public function show(GlossaryTerm $term): Response
    {
        return Inertia::render('seguridad/glosario/show', [
            'term' => $term,
        ]);
    }

    public function edit(GlossaryTerm $term): Response
    {
        return Inertia::render('seguridad/glosario/create', [
            'term' => $term,
            'categories' => self::CATEGORIES,
        ]);
    }

    public function update(StoreGlossaryTermRequest $request, GlossaryTerm $term): RedirectResponse
    {
        $term->update([
            ...$request->validated(),
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('seguridad.glosario.index')
            ->with('status', 'Término actualizado exitosamente.');
    }

    public function destroy(GlossaryTerm $term): RedirectResponse
    {
        $term->delete();

        return back()->with('status', 'Término eliminado exitosamente.');
    }
}

