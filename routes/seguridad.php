<?php

use App\Http\Controllers\Seguridad\AlcoholimetroController;
use App\Http\Controllers\Seguridad\AlertaController;
use App\Http\Controllers\Seguridad\AsignacionConductorController;
use App\Http\Controllers\Seguridad\ColaboradorController;
use App\Http\Controllers\Seguridad\CondicionSaludController;
use App\Http\Controllers\Seguridad\EstadoColaboradorController;
use App\Http\Controllers\Seguridad\PruebaAlcoholemiaController;
use App\Http\Controllers\Seguridad\PublicVerificationController;
use Illuminate\Support\Facades\Route;

// HU037: verificación pública del QR — intencionalmente fuera del grupo `auth`.
Route::get('verificar-prueba/{prueba}/{token}', [PublicVerificationController::class, 'show'])->name('seguridad.verificacion');

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

        // Rutas específicas de "pruebas" antes del resource para que no choquen
        // con la ruta comodín pruebas/{prueba}.
        Route::get('pruebas/calendario', [PruebaAlcoholemiaController::class, 'calendario'])->name('pruebas.calendario');
        Route::get('pruebas/exportar/pdf', [PruebaAlcoholemiaController::class, 'exportarPdf'])->name('pruebas.exportar-pdf');
        Route::get('pruebas/exportar/excel', [PruebaAlcoholemiaController::class, 'exportarExcel'])->name('pruebas.exportar-excel');
        Route::resource('pruebas', PruebaAlcoholemiaController::class)->only(['index', 'create', 'store', 'show']);

        Route::post('condiciones-salud', [CondicionSaludController::class, 'store'])->name('condiciones-salud.store');

        Route::get('alertas', [AlertaController::class, 'index'])->name('alertas.index');
        Route::patch('alertas/{alerta}/atender', [AlertaController::class, 'atender'])->name('alertas.atender');

        Route::resource('asignaciones-conductores', AsignacionConductorController::class)->except(['show', 'update', 'destroy']);

        Route::get('indicador', [EstadoColaboradorController::class, 'index'])->name('indicador.index');
    });
