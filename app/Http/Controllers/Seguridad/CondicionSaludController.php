<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seguridad\StoreCondicionSaludRequest;
use App\Models\Seguridad\CondicionSalud;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;

class CondicionSaludController extends Controller
{
    public function store(StoreCondicionSaludRequest $request): RedirectResponse
    {
        CondicionSalud::create([
            ...$request->validated(),
            'responsable_id' => $request->user()->id,
            'fecha_hora' => Carbon::now(),
        ]);

        return back()->with('status', 'Condición de salud registrada correctamente.');
    }
}
