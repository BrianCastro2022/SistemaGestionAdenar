<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Pruebas de Alcoholemia</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #111; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        p.subtitle { color: #555; margin-top: 0; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 5px 6px; text-align: left; }
        th { background-color: #f3f4f6; }
        .positivo { color: #b91c1c; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Reporte de Pruebas de Alcoholemia</h1>
    <p class="subtitle">Generado el {{ now()->format('d/m/Y H:i') }} &mdash; {{ $pruebas->count() }} registro(s)</p>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Colaborador</th>
                <th>Cédula</th>
                <th>Tipo</th>
                <th>Dispositivo</th>
                <th>Resultado</th>
                <th>Evaluación</th>
                <th>Estado</th>
                <th>Responsable</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($pruebas as $prueba)
                <tr>
                    <td>{{ $prueba->fecha_hora->format('d/m/Y H:i') }}</td>
                    <td>{{ $prueba->colaborador?->nombre_completo }}</td>
                    <td>{{ $prueba->colaborador?->cedula }}</td>
                    <td>{{ ucfirst($prueba->tipo) }}</td>
                    <td>{{ $prueba->alcoholimetro?->codigo }}</td>
                    <td class="{{ $prueba->es_positivo ? 'positivo' : '' }}">{{ $prueba->resultado ?? '—' }}</td>
                    <td>{{ $prueba->estado === 'programada' ? '—' : $prueba->evaluacion() }}</td>
                    <td>{{ ucfirst($prueba->estado) }}</td>
                    <td>{{ $prueba->responsable?->name }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
