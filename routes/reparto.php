<?php

use App\Http\Controllers\Reparto\CompensacionVariableController;
use App\Http\Controllers\Reparto\ModulacionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'active'])
    ->prefix('modules/reparto')
    ->name('reparto.')
    ->group(function () {
        // Modulación
        Route::get('/modulacion', [ModulacionController::class, 'index'])
            ->name('modulacion.index');
        Route::get('/modulacion/historial', [ModulacionController::class, 'historial'])
            ->name('modulacion.historial');
        Route::get('/modulacion-historial', [ModulacionController::class, 'historial'])
            ->name('modulacion.historial.sidebar');
        Route::post('/modulacion/header', [ModulacionController::class, 'saveHeader'])
            ->name('modulacion.saveHeader');
        Route::post('/modulacion/batch', [ModulacionController::class, 'storeBatch'])
            ->name('modulacion.storeBatch');
        Route::put('/modulacion/item/{id}', [ModulacionController::class, 'updateItem'])
            ->name('modulacion.updateItem');
        Route::delete('/modulacion/item/{id}', [ModulacionController::class, 'destroyItem'])
            ->name('modulacion.destroyItem');
        Route::put('/modulacion/novedad/{id}', [ModulacionController::class, 'updateNovedad'])
            ->name('modulacion.updateNovedad');
        Route::post('/modulacion/novedad', [ModulacionController::class, 'storeNovedad'])
            ->name('modulacion.storeNovedad');
        Route::delete('/modulacion/novedad/{id}', [ModulacionController::class, 'destroyNovedad'])
            ->name('modulacion.destroyNovedad');

        // Compensación Variable
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

