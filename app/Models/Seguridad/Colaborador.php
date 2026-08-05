<?php

namespace App\Models\Seguridad;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Colaborador extends Model
{
    use SoftDeletes;

    protected $table = 'colaboradores';

    protected $fillable = [
        'cedula',
        'nombres',
        'apellidos',
        'cargo',
        'turno',
        'area',
        'imagen',

        // Información básica adicional
        'expedido_en',
        'sexo',
        'fecha_nacimiento',
        'ciudad_residencia',
        'direccion',
        'estrato',
        'celular_1',
        'celular_2',
        'correo',
        'estado_civil',

        // Condiciones particulares
        'discapacidad',
        'victima_conflicto',
        'libreta_militar',

        // Antecedentes en la empresa
        'ha_trabajado_antes',
        'cargo_anterior',
        'fecha_ultima_laboral',

        // Experiencia
        'tiene_experiencia',
        'area_experiencia',
        'cargo_experiencia',
        'anios_experiencia',

        // QR SKAP
        'codigo_qr_skap',

        // Documentos
        'documento_cedula',
        'documento_licencia_conduccion',
        'documento_carnet_manejo_defensivo',
        'documento_certificado_manejo_defensivo',
        'documento_carnet_ingreso_cd',
        'documento_simit',
        'documento_examen_medico_ocupacional',
        'documento_recordatorio_vehiculo_licencia_conduccion',
        'documento_eps',
        'documento_pension',
        'documento_titulo_bachiller',
        'documento_titulo_academico',

        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'fecha_nacimiento' => 'date',
            'fecha_ultima_laboral' => 'date',
            'anios_experiencia' => 'integer',
        ];
    }

    public function condicionesSalud(): HasMany
    {
        return $this->hasMany(CondicionSalud::class);
    }

    public function pruebasAlcoholemia(): HasMany
    {
        return $this->hasMany(PruebaAlcoholemia::class);
    }

    public function alertas(): HasMany
    {
        return $this->hasMany(Alerta::class);
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(ColaboradorDocumento::class);
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombres} {$this->apellidos}");
    }

    public function getEdadAttribute(): ?int
    {
        return $this->fecha_nacimiento?->age;
    }
}