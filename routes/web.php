<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

require __DIR__.'/seguridad.php';
require __DIR__.'/colaborador.php';
require __DIR__.'/flota.php';
require __DIR__.'/capacitaciones.php';
require __DIR__.'/reparto.php';
require __DIR__.'/gente.php';

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::middleware('module.access')->group(function () {
        Route::get('modules/{module}', function (string $module) {
            return Inertia::render('modules/show', ['module' => $module]);
        })->whereIn('module', ['seguridad', 'reparto', 'gente', 'flota'])->name('modules.show');

        Route::get('modules/{module}/{submodule}', function (string $module, string $submodule, \Illuminate\Http\Request $request) {
            if ($module === 'seguridad' && $submodule === 'rutas-criticas') {
                return (new \App\Http\Controllers\Seguridad\RutaCriticaController)->index(
                    app(\App\Services\Seguridad\RutasCriticasDatosAbiertosService::class)
                );
            }
            if ($module === 'reparto' && $submodule === 'compensacion-variable') {
                return (new \App\Http\Controllers\Reparto\CompensacionVariableController)->index($request);
            }
            return Inertia::render('modules/submodule', ['module' => $module, 'submodule' => $submodule]);
        })->whereIn('module', ['seguridad', 'reparto', 'gente', 'flota'])->name('modules.submodule');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
