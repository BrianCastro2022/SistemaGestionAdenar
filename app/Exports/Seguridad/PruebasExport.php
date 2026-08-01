<?php

namespace App\Exports\Seguridad;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Events\AfterSheet;
use Maatwebsite\Excel\Concerns\FromCollection;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class PruebasExport implements FromCollection, WithColumnWidths, WithDrawings, WithEvents, WithHeadings, WithMapping
{
    private const FIRMA_ROW_HEIGHT = 45;

    public function __construct(private readonly Collection $pruebas)
    {
    }

    public function collection(): Collection
    {
        return $this->pruebas;
    }

    public function headings(): array
    {
        return ['Fecha', 'Colaborador', 'Cédula', 'Tipo', 'Dispositivo', 'Resultado', 'Evaluación', 'Estado', 'Responsable', 'Firma'];
    }

    /**
     * @return array<int, mixed>
     */
    public function map($prueba): array
    {
        return [
            $prueba->fecha_hora->format('d/m/Y H:i'),
            $prueba->colaborador?->nombre_completo,
            $prueba->colaborador?->cedula,
            ucfirst($prueba->tipo),
            $prueba->alcoholimetro?->codigo,
            $prueba->resultado,
            $prueba->estado === 'programada' ? '—' : $prueba->evaluacion(),
            ucfirst($prueba->estado),
            $prueba->responsable?->name,
            $prueba->firma_path ? '' : '—',
        ];
    }

    public function columnWidths(): array
    {
        return ['J' => 18];
    }

    /**
     * @return Drawing[]
     */
    public function drawings(): array
    {
        $drawings = [];

        foreach ($this->pruebas->values() as $index => $prueba) {
            if (! $prueba->firma_path || ! Storage::disk('public')->exists($prueba->firma_path)) {
                continue;
            }

            $drawing = new Drawing();
            $drawing->setName('Firma');
            $drawing->setPath(storage_path('app/public/'.$prueba->firma_path));
            $drawing->setHeight(self::FIRMA_ROW_HEIGHT - 6);
            $drawing->setCoordinates('J'.($index + 2));
            $drawing->setOffsetX(4);
            $drawing->setOffsetY(3);

            $drawings[] = $drawing;
        }

        return $drawings;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                foreach ($this->pruebas->values() as $index => $prueba) {
                    if ($prueba->firma_path) {
                        $event->sheet->getDelegate()->getRowDimension($index + 2)->setRowHeight(self::FIRMA_ROW_HEIGHT);
                    }
                }
            },
        ];
    }
}
