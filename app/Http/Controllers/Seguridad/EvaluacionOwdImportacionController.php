<?php

namespace App\Http\Controllers\Seguridad;

use App\Http\Controllers\Controller;
use App\Models\Seguridad\EvaluacionOwdImportacion;
use Inertia\Inertia;
use Inertia\Response;

class EvaluacionOwdImportacionController extends Controller
{
    public function index(): Response
    {
        $importaciones = EvaluacionOwdImportacion::with('usuario:id,name')
            ->latest()
            ->paginate(20);

        return Inertia::render('seguridad/evaluaciones-owd/importaciones', [
            'importaciones' => $importaciones,
        ]);
    }
}
