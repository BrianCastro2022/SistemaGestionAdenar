<?php

use App\Http\Controllers\Gente\ColaboradorController;
use App\Http\Controllers\Gente\ColaboradorEntrenamientoController;
use App\Http\Controllers\Gente\ColaboradorImportController;
use App\Http\Controllers\Gente\GeovictoriaAsistenciaController;
use App\Http\Controllers\Gente\LlamadoAtencionController;
use App\Http\Controllers\Gente\ReferenciaExternaController;
use Illuminate\Support\Facades\Route;

// Colaboradores es propiedad de Gente (crear/importar/editar/eliminar),
// mientras que Administrador, Seguridad, Reparto y Flota conservan acceso
// de solo lectura al listado y al detalle.
//
// El grupo con "create" se registra ANTES que el de solo lectura (que trae
// "show", ruta comodín colaboradores/{colaborador}) para que Laravel no
// intente resolver GET colaboradores/create como si "create" fuera un id.
Route::middleware(['auth', 'active', 'role:Administrador|Gente'])
    ->prefix('modules/gente')
    ->name('gente.')
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
        Route::resource('colaboradores', ColaboradorController::class)
            ->parameters(['colaboradores' => 'colaborador'])
            ->only(['create', 'store', 'edit', 'update', 'destroy']);

        // Wizard multipaso de colaboradores (HU01/HU02): cada paso persiste su
        // porción de datos por separado; el paso 4 marca el registro completo.
        // También es la vista de "editar" (ColaboradorController::edit delega
        // en wizard()), así que va en el grupo de escritura.
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
    });

Route::middleware(['auth', 'active', 'role:Administrador|Seguridad|Reparto|Flota|Gente'])
    ->prefix('modules/gente')
    ->name('gente.')
    ->group(function () {
        // Solo lectura: todos los roles de módulo pueden ver el listado y el
        // detalle de colaboradores, pero no crear/editar/importar/eliminar
        // (ver grupo role:Administrador|Gente arriba).
        Route::resource('colaboradores', ColaboradorController::class)
            ->parameters(['colaboradores' => 'colaborador'])
            ->only(['index', 'show']);
    });

Route::middleware(['auth', 'active', 'role:Administrador|Gente|Reparto'])
    ->prefix('modules/gente')
    ->name('gente.')
    ->group(function () {
        // Solo lectura: los datos los genera la automatizacion GeoVictoria
        // (ver POST /api/geovictoria/asistencias), no se crean/editan desde
        // la web. Visible para Gente (dueño del módulo) y Reparto.
        Route::get('asistencia-geovictoria', [GeovictoriaAsistenciaController::class, 'index'])
            ->name('asistencia-geovictoria.index');
    });
