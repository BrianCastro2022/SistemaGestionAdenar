<?php

namespace App\Models\Seguridad;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebScrapingSource extends Model
{
    use SoftDeletes;

    protected $table = 'web_scrape_sources';

    protected $fillable = [
        'nombre_fuente',
        'url',
        'selector_css',
        'categoria',
        'activo',
        'ultimo_scrape',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'ultimo_scrape' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scope para obtener solo fuentes activas
    public function scopeActive($query)
    {
        return $query->where('activo', true);
    }
}

