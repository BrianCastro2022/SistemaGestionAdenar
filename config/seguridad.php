<?php

return [
    // Resultado por encima de este valor se considera prueba positiva (HU039).
    'umbral_positivo' => 0.000,

    // Horas mínimas entre dos pruebas del mismo tipo para un mismo colaborador (HU029).
    'intervalo_minimo_horas' => 4,

    // Días de anticipación para alertar sobre calibración/certificado próximos a vencer (HU019).
    'dias_alerta_calibracion' => 15,

    // Días de historial considerados para el índice de riesgo del colaborador (HU045).
    'dias_indice_riesgo' => 90,
];
