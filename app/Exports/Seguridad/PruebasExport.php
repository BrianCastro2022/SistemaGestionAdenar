<?php

namespace App\Exports\Seguridad;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PruebasExport implements FromCollection, WithHeadings
{
    public function __construct(private readonly Collection $pruebas)
    {
    }

    public function headings(): array
    {
        return ['Fecha', 'Colaborador', 'Cédula', 'Tipo', 'Dispositivo', 'Resultado', 'Evaluación', 'Estado', 'Responsable'];
    }

    public function collection(): Collection
    {
        return $this->pruebas->map(fn ($prueba) => [
            $prueba->fecha_hora->format('d/m/Y H:i'),
            $prueba->colaborador?->nombre_completo,
            $prueba->colaborador?->cedula,
            ucfirst($prueba->tipo),
            $prueba->alcoholimetro?->codigo,
            $prueba->resultado,
            $prueba->estado === 'programada' ? '—' : $prueba->evaluacion(),
            ucfirst($prueba->estado),
            $prueba->responsable?->name,
        ]);
    }
}
