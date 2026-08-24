<?php

namespace App\Services\Colaborador;

/**
 * Aplana `config('morbilidad.secciones')` a un mapa por número de pregunta,
 * fuente única para las reglas de validación del envío final y para armar
 * los props de Inertia — así una corrección al catálogo no hay que
 * replicarla en varios sitios.
 */
class MorbilidadCatalogoService
{
    /**
     * @return array<int, array{seccion: int, texto: string, tipo: string, obligatorio: bool}>
     */
    public function preguntasPlanas(): array
    {
        $planas = [];

        foreach (config('morbilidad.secciones', []) as $numeroSeccion => $seccion) {
            foreach ($seccion['preguntas'] as $numeroPregunta => $pregunta) {
                $planas[$numeroPregunta] = [
                    'seccion' => $numeroSeccion,
                    'texto' => $pregunta['texto'],
                    'tipo' => $pregunta['tipo'],
                    'obligatorio' => $pregunta['tipo'] !== 'texto_libre',
                ];
            }
        }

        return $planas;
    }

    /**
     * @return array<int, string>
     */
    public function valoresPermitidosPorTipo(string $tipo): array
    {
        return match ($tipo) {
            'si_no', 'si_no_detalle' => ['Si', 'No'],
            'aplica_detalle' => ['Aplica', 'No aplica'],
            default => [],
        };
    }
}
