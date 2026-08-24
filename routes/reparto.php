<?php

use App\Http\Controllers\Reparto\CompensacionVariableController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'active'])
    ->prefix('modules/reparto')
    ->name('reparto.')
    ->group(function () {
        Route::get('/compensacion-variable', [CompensacionVariableController::class, 'index'])
            ->name('compensacion-variable.index');

        Route::post('/compensacion-variable/importar', [CompensacionVariableController::class, 'importar'])
            ->name('compensacion-variable.importar');

        Route::get('/compensacion-variable/{identificador}/detalle', [CompensacionVariableController::class, 'detalle'])
            ->name('compensacion-variable.detalle');

        Route::post('/compensacion-variable/limpiar', [CompensacionVariableController::class, 'limpiar'])
            ->name('compensacion-variable.limpiar');

        Route::get('/compensacion-variable-exportar', [CompensacionVariableController::class, 'exportar'])
            ->name('compensacion-variable.exportar');
    });
