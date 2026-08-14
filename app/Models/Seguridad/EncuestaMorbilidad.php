<?php

namespace App\Models\Seguridad;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EncuestaMorbilidad extends Model
{
    protected $table = 'encuestas_morbilidad';

    public const ESTADO_BORRADOR = 'borrador';

    public const ESTADO_COMPLETADA = 'completada';

    protected $fillable = [
        'colaborador_id',
        'estado',
        'fecha_hora',
        'enviado_en',
    ];

    protected function casts(): array
    {
        return [
            'fecha_hora' => 'datetime',
            'enviado_en' => 'datetime',
        ];
    }

    public function colaborador(): BelongsTo
    {
        return $this->belongsTo(Colaborador::class);
    }

    public function respuestas(): HasMany
    {
        return $this->hasMany(EncuestaMorbilidadRespuesta::class);
    }
}
