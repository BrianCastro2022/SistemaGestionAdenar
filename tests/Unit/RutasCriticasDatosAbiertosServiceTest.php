<?php

use App\Services\Seguridad\RutasCriticasDatosAbiertosService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

it('no guarda una respuesta fallida para que la siguiente carga pueda reintentarse', function () {
    Http::fake([
        'https://www.datos.gov.co/resource/7i66-rps2.json*' => Http::response([], 503),
    ]);

    $service = app(RutasCriticasDatosAbiertosService::class);

    expect($service->obtenerAfectacionesVia())->toBe([])
        ->and(Cache::has('seguridad.rutas-criticas.afectaciones-vias.v2'))->toBeFalse();
});

it('guarda las respuestas validas de vias afectadas', function () {
    $respuesta = [['municipio' => 'Pasto', 'departamento' => 'Nariño']];

    Http::fake([
        'https://www.datos.gov.co/resource/7i66-rps2.json*' => Http::response($respuesta),
    ]);

    $service = app(RutasCriticasDatosAbiertosService::class);

    expect($service->obtenerAfectacionesVia())->toBe($respuesta)
        ->and(Cache::get('seguridad.rutas-criticas.afectaciones-vias.v2'))->toBe($respuesta);
});
