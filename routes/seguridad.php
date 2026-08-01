<?php

use App\Http\Controllers\Seguridad\AlcoholimetroController;
use App\Http\Controllers\Seguridad\AlertaController;
use App\Http\Controllers\Seguridad\ColaboradorController;
use App\Http\Controllers\Seguridad\CondicionSaludController;
use App\Http\Controllers\Seguridad\PruebaAlcoholemiaController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'active', 'role:Administrador|Seguridad'])
    ->prefix('modules/seguridad')
    ->name('seguridad.')
    ->group(function () {
        // El pluralizador en inglés de Laravel no singulariza bien "colaboradores"
        // (produce "colaboradore"), así que se fuerza el nombre del parámetro.
        Route::resource('colaboradores', ColaboradorController::class)->parameters(['colaboradores' => 'colaborador']);

        Route::resource('dispositivos', AlcoholimetroController::class);
        Route::post('dispositivos/{dispositivo}/mantenimientos', [AlcoholimetroController::class, 'storeMantenimiento'])
            ->name('dispositivos.mantenimientos.store');

        Route::resource('pruebas', PruebaAlcoholemiaController::class)->only(['index', 'create', 'store', 'show']);

        Route::post('condiciones-salud', [CondicionSaludController::class, 'store'])->name('condiciones-salud.store');

        Route::get('alertas', [AlertaController::class, 'index'])->name('alertas.index');
        Route::patch('alertas/{alerta}/atender', [AlertaController::class, 'atender'])->name('alertas.atender');
    });
