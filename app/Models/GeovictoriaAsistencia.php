<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeovictoriaAsistencia extends Model
{
    protected $fillable = [
        'identificador',
        'fecha',
        'apellidos',
        'nombres',
        'cargo',
        'grupo',
        'entrada',
        'salida_descanso',
        'ingreso_descanso',
        'salida',
        'horas_trabajadas',
        'exceso_jornada',
        'horas_descanso_previo',
        'descanso_no_efectivo',
    ];

    protected $casts = [
        'fecha' => 'date',
        'exceso_jornada' => 'boolean',
        'descanso_no_efectivo' => 'boolean',
    ];
}
