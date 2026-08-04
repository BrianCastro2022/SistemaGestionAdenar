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
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class PruebasExport implements FromCollection, WithColumnWidths, WithDrawings, WithEvents, WithHeadings, WithMapping
{
    private const FOTO_ROW_HEIGHT = 45;

    /**
     * Columna base (1-indexada) donde empiezan las evidencias adicionales: A..J son las
     * columnas fijas del reporte, K es la evidencia principal, L en adelante son las adicionales.
     */
    private const PRIMERA_COLUMNA_ADICIONALES = 12;

    private readonly int $maxEvidenciasAdicionales;

    public function __construct(private readonly Collection $pruebas)
    {
        $this->maxEvidenciasAdicionales = (int) ($this->pruebas->max(fn ($prueba) => $prueba->evidencias->count()) ?? 0);
    }

    public function collection(): Collection
    {
        return $this->pruebas;
    }

    public function headings(): array
    {
        $headings = ['Fecha', 'Colaborador', 'Cédula', 'Tipo', 'Dispositivo', 'Resultado', 'Evaluación', 'Estado', 'Responsable', 'Firma', 'Evidencia principal'];

        for ($i = 1; $i <= $this->maxEvidenciasAdicionales; $i++) {
            $headings[] = "Evidencia adicional {$i}";
        }

        return $headings;
    }

    /**
     * @return array<int, mixed>
     */
    public function map($prueba): array
    {
        $fila = [
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
            $prueba->evidencia_path ? '' : '—',
        ];

        for ($i = 0; $i < $this->maxEvidenciasAdicionales; $i++) {
            $fila[] = $prueba->evidencias->get($i) ? '' : '—';
        }

        return $fila;
    }

    public function columnWidths(): array
    {
        $widths = ['J' => 18, 'K' => 18];

        for ($i = 0; $i < $this->maxEvidenciasAdicionales; $i++) {
            $widths[Coordinate::stringFromColumnIndex(self::PRIMERA_COLUMNA_ADICIONALES + $i)] = 18;
        }

        return $widths;
    }

    /**
     * @return Drawing[]
     */
    public function drawings(): array
    {
        $drawings = [];

        foreach ($this->pruebas->values() as $index => $prueba) {
            $fila = $index + 2;

            $this->agregarDrawing($drawings, $prueba->firma_path, "J{$fila}", 'Firma');
            $this->agregarDrawing($drawings, $prueba->evidencia_path, "K{$fila}", 'Evidencia principal');

            foreach ($prueba->evidencias as $i => $evidencia) {
                $columna = Coordinate::stringFromColumnIndex(self::PRIMERA_COLUMNA_ADICIONALES + $i);
                $this->agregarDrawing($drawings, $evidencia->path, "{$columna}{$fila}", 'Evidencia adicional');
            }
        }

        return $drawings;
    }

    /**
     * @param  Drawing[]  $drawings
     */
    private function agregarDrawing(array &$drawings, ?string $path, string $coordenadas, string $nombre): void
    {
        if (! $path || ! Storage::disk('public')->exists($path)) {
            return;
        }

        $drawing = new Drawing();
        $drawing->setName($nombre);
        $drawing->setPath(storage_path('app/public/'.$path));
        $drawing->setHeight(self::FOTO_ROW_HEIGHT - 6);
        $drawing->setCoordinates($coordenadas);
        $drawing->setOffsetX(4);
        $drawing->setOffsetY(3);

        $drawings[] = $drawing;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                foreach ($this->pruebas->values() as $index => $prueba) {
                    if ($prueba->firma_path || $prueba->evidencia_path || $prueba->evidencias->isNotEmpty()) {
                        $event->sheet->getDelegate()->getRowDimension($index + 2)->setRowHeight(self::FOTO_ROW_HEIGHT);
                    }
                }
            },
        ];
    }
}
