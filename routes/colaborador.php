<?php

use App\Http\Controllers\Colaborador\CondicionSaludController;
use App\Http\Controllers\Colaborador\PortalController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'active', 'role:Colaborador'])
    ->prefix('portal')
    ->name('portal.')
    ->group(function () {
        Route::get('/', [PortalController::class, 'index'])->name('index');
        Route::get('perfil', [PortalController::class, 'perfil'])->name('perfil');
        Route::get('pruebas', [PortalController::class, 'pruebas'])->name('pruebas');
        Route::get('rutas', [PortalController::class, 'rutas'])->name('rutas');
        Route::get('alertas', [PortalController::class, 'alertas'])->name('alertas');
        Route::get('condicion-salud', [CondicionSaludController::class, 'create'])->name('condicion-salud');
        Route::post('condicion-salud', [CondicionSaludController::class, 'store'])->name('condicion-salud.store');
        Route::get('condicion-salud/historial', [CondicionSaludController::class, 'historial'])->name('condicion-salud.historial');
    });
