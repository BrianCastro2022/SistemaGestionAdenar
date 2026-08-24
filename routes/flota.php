<?php

use App\Http\Controllers\Flota\VehiculoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'active', 'role:Administrador|Flota'])
    ->prefix('modules/flota')
    ->name('flota.')
    ->group(function () {
        Route::resource('vehiculos', VehiculoController::class)->parameters(['vehiculos' => 'vehiculo']);
    });
