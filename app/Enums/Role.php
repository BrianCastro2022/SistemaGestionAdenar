<?php

namespace App\Enums;

enum Role: string
{
    case Administrador = 'Administrador';
    case Seguridad = 'Seguridad';
    case Reparto = 'Reparto';
    case Gente = 'Gente';
    case Flota = 'Flota';

    /**
     * Roles that map 1:1 to a business module slug (excludes Administrador).
     *
     * @return array<string, self>
     */
    public static function moduleRoles(): array
    {
        return [
            'seguridad' => self::Seguridad,
            'reparto' => self::Reparto,
            'gente' => self::Gente,
            'flota' => self::Flota,
        ];
    }

    public static function forModuleSlug(string $slug): ?self
    {
        return self::moduleRoles()[$slug] ?? null;
    }
}
