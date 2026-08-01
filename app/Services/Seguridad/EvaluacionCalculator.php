<?php

namespace App\Services\Seguridad;

use App\Models\Seguridad\Colaborador;
use App\Models\Seguridad\CondicionSalud;
use App\Models\Seguridad\PruebaAlcoholemia;
use Illuminate\Support\Carbon;

class EvaluacionCalculator
{
    /**
     * HU047: estado del colaborador hoy (Apto / Apto con Observaciones / No Apto),
     * o null si todavía no tiene ningún registro el día de hoy.
     */
    public function paraColaboradorHoy(Colaborador $colaborador): ?string
    {
        $hoy = Carbon::today();

        $huboPositiva = PruebaAlcoholemia::query()
            ->where('colaborador_id', $colaborador->id)
            ->whereDate('fecha_hora', $hoy)
            ->where('es_positivo', true)
            ->exists();

        if ($huboPositiva) {
            return 'No Apto';
        }

        $condicion = CondicionSalud::query()
            ->where('colaborador_id', $colaborador->id)
            ->whereDate('fecha_hora', $hoy)
            ->latest('fecha_hora')
            ->first();

        $huboPrueba = PruebaAlcoholemia::query()
            ->where('colaborador_id', $colaborador->id)
            ->whereDate('fecha_hora', $hoy)
            ->where('estado', 'realizada')
            ->exists();

        if (! $condicion && ! $huboPrueba) {
            return null;
        }

        return match ($condicion?->estado) {
            'Malo' => 'No Apto',
            'Regular' => 'Apto con Observaciones',
            default => 'Apto',
        };
    }
}
