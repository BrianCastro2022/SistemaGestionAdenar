<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

require __DIR__.'/seguridad.php';

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::middleware('module.access')->group(function () {
        Route::get('modules/{module}', function (string $module) {
            return Inertia::render('modules/show', ['module' => $module]);
        })->whereIn('module', ['seguridad', 'reparto', 'gente', 'flota'])->name('modules.show');

        Route::get('modules/{module}/{submodule}', function (string $module, string $submodule) {
            if ($module === 'seguridad' && $submodule === 'rutas-criticas') {
                return (new \App\Http\Controllers\Seguridad\RutaCriticaController)->index(
                    app(\App\Services\Seguridad\RutasCriticasDatosAbiertosService::class)
                );
            }
            return Inertia::render('modules/submodule', ['module' => $module, 'submodule' => $submodule]);
        })->whereIn('module', ['seguridad', 'reparto', 'gente', 'flota'])->name('modules.submodule');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
