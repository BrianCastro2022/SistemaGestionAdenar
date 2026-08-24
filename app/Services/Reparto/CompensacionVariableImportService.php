<?php

namespace App\Services\Reparto;

use App\Models\Reparto\CompensacionVariable;
use App\Models\Seguridad\Colaborador;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Throwable;

class CompensacionVariableImportService
{
    private function normalizeHeader(string $text): string
    {
        $text = mb_strtoupper(trim($text), 'UTF-8');
        $unaccented = strtr(utf8_decode($text), utf8_decode('ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑ'), 'AEIOUAEIOUAEIOUAEIOUN');
        return preg_replace('/[^A-Z0-9]/', '', $unaccented);
    }

    private function parseNumber($val): float
    {
        if ($val === null || $val === '') {
            return 0.0;
        }
        if (is_numeric($val)) {
            return (float) $val;
        }
        if (!is_string($val)) {
            return 0.0;
        }
        // Remove currency symbols, % and spaces
        $clean = preg_replace('/[^0-9\.,\-]/', '', $val);
        // Handle comma vs dot
        if (str_contains($clean, ',') && str_contains($clean, '.')) {
            $clean = str_replace(',', '', $clean);
        } else if (str_contains($clean, ',')) {
            $clean = str_replace(',', '.', $clean);
        }
        return (float) $clean;
    }

    private function parsePercent($val): float
    {
        if ($val === null || $val === '') {
            return 0.0;
        }
        $rawString = (string)$val;
        $num = $this->parseNumber($rawString);

        if (str_contains($rawString, '%')) {
            return $num > 1 ? $num / 100 : $num;
        }
        if ($num > 1.0) {
            return $num / 100;
        }
        return $num;
    }

    public function importar(array $rutasArchivos): array
    {
        $archivosProcesados = 0;
        $registrosCreados = 0;
        $errores = 0;
        $allIdentificadores = [];

        foreach ($rutasArchivos as $path => $originalName) {
            try {
                $spreadsheet = IOFactory::load($path);
                $worksheet = $spreadsheet->getActiveSheet();

                // Read values with formatting / formulas evaluated
                $rows = [];
                foreach ($worksheet->getRowIterator() as $row) {
                    $cellIterator = $row->getCellIterator();
                    $cellIterator->setIterateOnlyExistingCells(false);
                    $rowData = [];
                    foreach ($cellIterator as $colLetter => $cell) {
                        $val = $cell->getCalculatedValue();
                        $formatted = $cell->getFormattedValue();

                        if (is_string($formatted) && (str_contains($formatted, '%') || str_contains($formatted, '$'))) {
                            $rowData[$colLetter] = $formatted;
                        } else {
                            $rowData[$colLetter] = $val !== null ? $val : $formatted;
                        }
                    }
                    $rows[$row->getRowIndex()] = $rowData;
                }

                if (empty($rows)) {
                    continue;
                }

                // Find header row (first row with data)
                $headerRowIndex = 1;
                $colMap = [];

                foreach ($rows as $rIdx => $row) {
                    $nonEmpty = array_filter($row, fn($v) => $v !== null && trim((string)$v) !== '');
                    if (count($nonEmpty) >= 3) {
                        $headerRowIndex = $rIdx;
                        foreach ($row as $colLetter => $headerText) {
                            if (!$headerText) continue;
                            $norm = $this->normalizeHeader((string)$headerText);

                            if (str_contains($norm, 'ANIO') || str_contains($norm, 'ANO')) $colMap['anio'] = $colLetter;
                            else if ($norm === 'MES') $colMap['mes'] = $colLetter;
                            else if ($norm === 'MES2' || str_contains($norm, 'MES2')) $colMap['mes2'] = $colLetter;
                            else if (str_contains($norm, 'REGIONAL') || str_contains($norm, 'REGION')) $colMap['regional'] = $colLetter;
                            else if ($norm === 'CD' || str_contains($norm, 'DISTRIBUCION')) $colMap['cd'] = $colLetter;
                            else if (str_contains($norm, 'CODIGOOB') || str_contains($norm, 'CODOB')) $colMap['codigo_ob'] = $colLetter;
                            else if (str_contains($norm, 'CODIGOGP') || str_contains($norm, 'CODGP')) $colMap['codigo_gp'] = $colLetter;
                            else if (str_contains($norm, 'IDENTIFICADOR') || str_contains($norm, 'CEDULA') || $norm === 'ID') $colMap['identificador'] = $colLetter;
                            else if (str_contains($norm, 'NOMBRE') || str_contains($norm, 'COLABORADOR')) $colMap['nombre'] = $colLetter;
                            else if (str_contains($norm, 'CARGO')) $colMap['cargo'] = $colLetter;
                            else if (str_contains($norm, 'JUSTIFICADA') && !str_contains($norm, 'INJUSTIFICADA')) $colMap['ausencia_justificada'] = $colLetter;
                            else if (str_contains($norm, 'INJUSTIFICADA')) $colMap['ausencia_injustificada'] = $colLetter;
                            else if (str_contains($norm, 'TRI') || str_contains($norm, 'FATALIDAD')) $colMap['tri_fatalidades'] = $colLetter;
                            else if (str_contains($norm, 'ADHERENCIA')) $colMap['adherencia_gp'] = $colLetter;
                            else if (str_contains($norm, 'MARKET') || str_contains($norm, 'POCS') || str_contains($norm, 'REFUSAL')) $colMap['market_refusals'] = $colLetter;
                            else if (str_contains($norm, 'RECHAZO')) $colMap['porcentaje_rechazos'] = $colLetter;
                            else if (str_contains($norm, 'HABILITADOR')) $colMap['habilitadores'] = $colLetter;
                            // Order below is crucial: PAGOVARIABLE & SALARIO before VARIABLE to prevent header collision
                            else if (str_contains($norm, 'PAGOVARIABLE') || str_contains($norm, 'PAGODT') || str_contains($norm, 'PAGOVARIABLEDT') || str_contains($norm, 'TOTALPAGO')) $colMap['pago_variable_dt'] = $colLetter;
                            else if (str_contains($norm, 'SALARIO')) $colMap['salario_variable'] = $colLetter;
                            else if (str_contains($norm, 'TRABAJADO') || str_contains($norm, 'DIAS')) $colMap['dias_trabajados'] = $colLetter;
                            else if ($norm === 'VARIABLE' || (str_contains($norm, 'VARIABLE') && !str_contains($norm, 'SALARIO') && !str_contains($norm, 'PAGO'))) $colMap['variable'] = $colLetter;
                        }
                        break;
                    }
                }

                DB::beginTransaction();

                for ($i = $headerRowIndex + 1; $i <= count($rows); $i++) {
                    $row = $rows[$i] ?? null;
                    if (!$row) continue;

                    $getValue = fn($key) => isset($colMap[$key]) ? trim((string)($row[$colMap[$key]] ?? '')) : null;

                    $identificador = $getValue('identificador');
                    $nombre = $getValue('nombre');

                    // Skip empty rows
                    if (!$identificador && !$nombre) {
                        continue;
                    }

                    if ($identificador) {
                        $allIdentificadores[] = $identificador;
                    }

                    $salarioVariable = $this->parseNumber($getValue('salario_variable'));
                    $diasTrabajados = $this->parseNumber($getValue('dias_trabajados'));
                    $rawVariable = $getValue('variable');
                    $variableDecimal = $this->parsePercent($rawVariable);

                    // Formatted string representation of percentage for display
                    $variableFormatted = $rawVariable ? (str_contains($rawVariable, '%') ? $rawVariable : (round($variableDecimal * 100, 1) . '%')) : '0%';

                    $habilitadores = $this->parseNumber($getValue('habilitadores'));
                    if ($habilitadores <= 0 && $getValue('habilitadores') === null) {
                        $habilitadores = 1.0;
                    }

                    // User Formula: =(SalarioVariable / 30) * DiasTrabajados * VariableEnDecimal
                    $pagoVariableDtCalculated = ($salarioVariable / 30.0) * $diasTrabajados * $variableDecimal;

                    // Apply habilitadores factor if habilitadores < 1.0 (e.g. 0.8 or 0)
                    if ($habilitadores < 1.0) {
                        $pagoVariableDtCalculated *= $habilitadores;
                    }

                    $pagoVariableDt = round($pagoVariableDtCalculated, 2);
                    $anioVal = (int) $this->parseNumber($getValue('anio')) ?: (int) date('Y');

                    $payload = [
                        'anio' => $anioVal,
                        'mes' => $getValue('mes'),
                        'mes2' => $getValue('mes2'),
                        'regional' => $getValue('regional'),
                        'cd' => $getValue('cd'),
                        'codigo_ob' => $getValue('codigo_ob'),
                        'codigo_gp' => $getValue('codigo_gp'),
                        'nombre' => $nombre,
                        'cargo' => $getValue('cargo'),
                        'ausencia_justificada' => $this->parseNumber($getValue('ausencia_justificada')),
                        'ausencia_injustificada' => $this->parseNumber($getValue('ausencia_injustificada')),
                        'tri_fatalidades' => $this->parseNumber($getValue('tri_fatalidades')),
                        'adherencia_gp' => $getValue('adherencia_gp'),
                        'market_refusals' => $getValue('market_refusals'),
                        'porcentaje_rechazos' => $this->parseNumber($getValue('porcentaje_rechazos')),
                        'habilitadores' => $habilitadores,
                        'variable' => $variableFormatted,
                        'dias_trabajados' => $diasTrabajados,
                        'salario_variable' => $salarioVariable,
                        'pago_variable_dt' => $pagoVariableDt,
                        'total_pago' => $pagoVariableDt,
                    ];

                    // Use updateOrCreate to avoid duplicates per identificador
                    if ($identificador) {
                        CompensacionVariable::updateOrCreate(
                            ['identificador' => $identificador],
                            $payload
                        );
                    } else {
                        CompensacionVariable::create(array_merge(['identificador' => null], $payload));
                    }

                    $registrosCreados++;
                }

                DB::commit();
                $archivosProcesados++;

            } catch (Throwable $e) {
                DB::rollBack();
                Log::error("Error importando Excel compensacion variable ({$originalName}): " . $e->getMessage());
                $errores++;
            }
        }

        $uniqueIdentificadores = array_values(array_unique(array_filter($allIdentificadores)));
        $colaboradoresEncontrados = Colaborador::whereIn('cedula', $uniqueIdentificadores)->count();

        return [
            'archivos_procesados' => $archivosProcesados,
            'registros_creados' => $registrosCreados,
            'colaboradores_unicos' => count($uniqueIdentificadores),
            'colaboradores_encontrados' => $colaboradoresEncontrados,
            'errores' => $errores,
        ];
    }
}
