<?php

use App\Http\Controllers\Seguridad\AlcoholimetroController;
use App\Http\Controllers\Seguridad\AlertaController;
use App\Http\Controllers\Seguridad\AsignacionConductorController;
use App\Http\Controllers\Seguridad\ColaboradorController;
use App\Http\Controllers\Seguridad\ColaboradorEntrenamientoController;
use App\Http\Controllers\Seguridad\ColaboradorImportController;
use App\Http\Controllers\Seguridad\CondicionSaludController;
use App\Http\Controllers\Seguridad\LlamadoAtencionController;
use App\Http\Controllers\Seguridad\EstadoColaboradorController;
use App\Http\Controllers\Seguridad\PruebaAlcoholemiaController;
use App\Http\Controllers\Seguridad\PublicVerificationController;
use App\Http\Controllers\Seguridad\ReferenciaExternaController;
use App\Http\Controllers\Seguridad\RutaCriticaController;
use App\Http\Controllers\Seguridad\GlossaryTermController;
use Illuminate\Support\Facades\Route;

// HU037: verificación pública del QR — intencionalmente fuera del grupo `auth`.
Route::get('verificar-prueba/{prueba}/{token}', [PublicVerificationController::class, 'show'])->name('seguridad.verificacion');

Route::middleware(['auth', 'active', 'role:Administrador|Seguridad'])
    ->prefix('modules/seguridad')
    ->name('seguridad.')
    ->group(function () {
        // Rutas específicas de "colaboradores" antes del resource para que no
        // choquen con la ruta comodín colaboradores/{colaborador}.
        Route::get('colaboradores/referencias/departamentos', [ReferenciaExternaController::class, 'departamentos'])
            ->name('colaboradores.referencias.departamentos');
        Route::get('colaboradores/referencias/ciudades', [ReferenciaExternaController::class, 'ciudades'])
            ->name('colaboradores.referencias.ciudades');
        Route::get('colaboradores/referencias/instituciones-sena', [ReferenciaExternaController::class, 'institucionesSena'])
            ->name('colaboradores.referencias.instituciones-sena');

        // Carga masiva desde el Excel de nómina ("BASE ACTUALIZADA").
        Route::post('colaboradores/importar', [ColaboradorImportController::class, 'store'])
            ->name('colaboradores.importar');

        // El pluralizador en inglés de Laravel no singulariza bien "colaboradores"
        // (produce "colaboradore"), así que se fuerza el nombre del parámetro.
        Route::resource('colaboradores', ColaboradorController::class)->parameters(['colaboradores' => 'colaborador']);

        // Wizard multipaso de colaboradores (HU01/HU02): cada paso persiste su
        // porción de datos por separado; el paso 4 marca el registro completo.
        Route::get('colaboradores/{colaborador}/wizard', [ColaboradorController::class, 'wizard'])
            ->name('colaboradores.wizard');
        Route::patch('colaboradores/{colaborador}/paso-1', [ColaboradorController::class, 'updatePaso1'])
            ->name('colaboradores.paso1.update');
        Route::patch('colaboradores/{colaborador}/paso-2', [ColaboradorController::class, 'updatePaso2'])
            ->name('colaboradores.paso2.update');
        Route::patch('colaboradores/{colaborador}/paso-3', [ColaboradorController::class, 'updatePaso3'])
            ->name('colaboradores.paso3.update');
        Route::patch('colaboradores/{colaborador}/paso-4', [ColaboradorController::class, 'updatePaso4'])
            ->name('colaboradores.paso4.update');

        // HU04: activar/desactivar desde la vista de detalle.
        Route::patch('colaboradores/{colaborador}/toggle-activo', [ColaboradorController::class, 'toggleActivo'])
            ->name('colaboradores.toggle-activo');

        // Paso 5/6: registros que se acumulan durante la relación laboral,
        // gestionados desde la vista de detalle (show), no desde el wizard.
        Route::post('colaboradores/{colaborador}/llamados-atencion', [LlamadoAtencionController::class, 'store'])
            ->name('colaboradores.llamados-atencion.store');
        Route::post('colaboradores/{colaborador}/entrenamientos', [ColaboradorEntrenamientoController::class, 'store'])
            ->name('colaboradores.entrenamientos.store');

        Route::resource('dispositivos', AlcoholimetroController::class);
        Route::post('dispositivos/{dispositivo}/mantenimientos', [AlcoholimetroController::class, 'storeMantenimiento'])
            ->name('dispositivos.mantenimientos.store');

        // Rutas específicas de "pruebas" antes del resource para que no choquen
        // con la ruta comodín pruebas/{prueba}.
        Route::get('pruebas/calendario', [PruebaAlcoholemiaController::class, 'calendario'])->name('pruebas.calendario');
        Route::get('pruebas/exportar/pdf', [PruebaAlcoholemiaController::class, 'exportarPdf'])->name('pruebas.exportar-pdf');
        Route::get('pruebas/exportar/excel', [PruebaAlcoholemiaController::class, 'exportarExcel'])->name('pruebas.exportar-excel');
        Route::resource('pruebas', PruebaAlcoholemiaController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update']);

        Route::get('condiciones-salud', [CondicionSaludController::class, 'index'])->name('condiciones-salud.index');
        Route::post('condiciones-salud', [CondicionSaludController::class, 'store'])->name('condiciones-salud.store');
        Route::post('condiciones-salud/{condicion}/firmar', [CondicionSaludController::class, 'firmar'])->name('condiciones-salud.firmar');

        Route::get('alertas', [AlertaController::class, 'index'])->name('alertas.index');
        Route::patch('alertas/{alerta}/atender', [AlertaController::class, 'atender'])->name('alertas.atender');

        Route::resource('asignaciones-conductores', AsignacionConductorController::class)->except(['show', 'update', 'destroy']);

        Route::get('indicador', [EstadoColaboradorController::class, 'index'])->name('indicador.index');
        Route::resource('glosario', GlossaryTermController::class);

        Route::get('rutas-criticas', [RutaCriticaController::class, 'index'])
            ->name('rutas-criticas.index');
    });
