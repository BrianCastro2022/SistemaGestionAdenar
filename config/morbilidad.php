<?php

// Catálogo de la Encuesta de Morbilidad Sentida (HU-01 a HU-10). Es la
// única fuente de verdad para el formulario del colaborador, la vista de
// consulta de SST y las reglas de validación del envío final — así una
// corrección de texto o de tipo de pregunta se hace en un solo lugar.
//
// Tipos de pregunta:
// - 'si_no_detalle': Select Sí/No; si "Sí", el campo "detalle" es obligatorio (RN-02).
// - 'aplica_detalle': Select "No aplica"/"Aplica" (default "No aplica"); si "Aplica",
//   "detalle" es obligatorio (RN-03/RN-04/RN-05).
// - 'si_no': Select Sí/No simple, obligatorio, sin campo de detalle.
// - 'texto_libre': textarea siempre visible, nunca obligatorio.
//
// La sección 1 ("Datos del colaborador", HU-01) no tiene preguntas aquí:
// es precarga de solo lectura del perfil del colaborador autenticado.

return [
    'secciones' => [
        2 => [
            'titulo' => 'Molestias experimentadas en los últimos 6 meses',
            'preguntas' => [
                7 => ['texto' => 'Dolor de cabeza', 'tipo' => 'si_no_detalle'],
                8 => ['texto' => 'Dolor de cuello, espalda y cintura', 'tipo' => 'si_no_detalle'],
                9 => ['texto' => 'Dolores musculares', 'tipo' => 'si_no_detalle'],
                10 => ['texto' => 'Dificultad para algún movimiento', 'tipo' => 'si_no_detalle'],
                11 => ['texto' => 'Tos frecuente', 'tipo' => 'si_no_detalle'],
                12 => ['texto' => 'Dificultad respiratoria', 'tipo' => 'si_no_detalle'],
                13 => ['texto' => 'Gastritis, úlcera', 'tipo' => 'si_no_detalle'],
                14 => ['texto' => 'Otras alteraciones del funcionamiento digestivo', 'tipo' => 'si_no_detalle'],
                15 => ['texto' => 'Alteraciones del sueño (insomnio, somnolencia)', 'tipo' => 'si_no_detalle'],
                16 => ['texto' => 'Dificultad para concentrarse', 'tipo' => 'si_no_detalle'],
                17 => ['texto' => 'Mal genio', 'tipo' => 'si_no_detalle'],
                18 => ['texto' => 'Nerviosismo', 'tipo' => 'si_no_detalle'],
                19 => ['texto' => 'Cansancio mental', 'tipo' => 'si_no_detalle'],
                20 => ['texto' => 'Palpitaciones', 'tipo' => 'si_no_detalle'],
                21 => ['texto' => 'Dolor en el pecho (angina)', 'tipo' => 'si_no_detalle'],
                22 => ['texto' => 'Cambios visuales', 'tipo' => 'si_no_detalle'],
                23 => ['texto' => 'Cansancio, fatiga, ardor o disconfort visual', 'tipo' => 'si_no_detalle'],
                24 => ['texto' => 'Pitos o ruidos continuos o intermitentes en los oídos', 'tipo' => 'si_no_detalle'],
                25 => ['texto' => 'Dificultad para oír', 'tipo' => 'si_no_detalle'],
                26 => ['texto' => 'Sensación permanente de cansancio', 'tipo' => 'si_no_detalle'],
                27 => ['texto' => 'Alteraciones en la piel', 'tipo' => 'si_no_detalle'],
                28 => ['texto' => 'Otras alteraciones no anotadas', 'tipo' => 'texto_libre'],
            ],
        ],

        3 => [
            'titulo' => 'Enfermedades diagnosticadas en brazos o piernas',
            'preguntas' => [
                29 => ['texto' => 'Enfermedades de los músculos, tendones y ligamentos (desgarros, tendinitis, bursitis, esguinces, torceduras)', 'tipo' => 'aplica_detalle'],
                30 => ['texto' => 'Enfermedades de los nervios (síndrome del túnel del carpo u otros)', 'tipo' => 'aplica_detalle'],
                31 => ['texto' => 'Fracturas', 'tipo' => 'aplica_detalle'],
                32 => ['texto' => 'Amputaciones en los brazos o piernas', 'tipo' => 'aplica_detalle'],
                33 => ['texto' => 'Acortamiento de una pierna', 'tipo' => 'aplica_detalle'],
                34 => ['texto' => 'Hernias (inguinal, abdominal)', 'tipo' => 'aplica_detalle'],
                35 => ['texto' => 'Várices en las piernas', 'tipo' => 'aplica_detalle'],
            ],
        ],

        4 => [
            'titulo' => 'Síntomas en manos, brazos, pies o piernas',
            'preguntas' => [
                36 => ['texto' => 'Adormecimiento u hormigueo', 'tipo' => 'aplica_detalle'],
                37 => ['texto' => 'Disminución de la fuerza', 'tipo' => 'aplica_detalle'],
                38 => ['texto' => 'Dolor o inflamación', 'tipo' => 'aplica_detalle'],
            ],
        ],

        5 => [
            'titulo' => 'Enfermedades o condiciones diagnosticadas',
            'preguntas' => [
                39 => ['texto' => 'Enfermedades del corazón', 'tipo' => 'aplica_detalle'],
                40 => ['texto' => 'Enfermedades de los pulmones (asma, enfisema, bronquitis)', 'tipo' => 'aplica_detalle'],
                41 => ['texto' => 'Diabetes (azúcar alta en la sangre)', 'tipo' => 'aplica_detalle'],
                42 => ['texto' => 'Enfermedades cerebrales (derrames, trombosis, epilepsia)', 'tipo' => 'aplica_detalle'],
                43 => ['texto' => 'Enfermedades de los huesos o articulaciones (artritis, gota, lupus, reumatismo, osteoporosis)', 'tipo' => 'aplica_detalle'],
                44 => ['texto' => 'Enfermedades de la columna vertebral (hernia de disco, compresión de raíces nerviosas, ciática, escoliosis o fractura)', 'tipo' => 'aplica_detalle'],
                45 => ['texto' => 'Enfermedades digestivas', 'tipo' => 'aplica_detalle'],
                46 => ['texto' => 'Enfermedades de la piel', 'tipo' => 'aplica_detalle'],
                47 => ['texto' => 'Alergias en piel o vías respiratorias', 'tipo' => 'aplica_detalle'],
                48 => ['texto' => 'Trastornos de audición', 'tipo' => 'aplica_detalle'],
                49 => ['texto' => 'Alteraciones visuales', 'tipo' => 'aplica_detalle'],
                50 => ['texto' => 'Hipertensión arterial o tensión alta', 'tipo' => 'aplica_detalle'],
                51 => ['texto' => 'Colesterol o triglicéridos elevados', 'tipo' => 'aplica_detalle'],
            ],
        ],

        6 => [
            'titulo' => 'Manifestaciones durante los últimos 6 meses',
            'preguntas' => [
                52 => ['texto' => 'Dolor en el pecho o palpitaciones', 'tipo' => 'si_no'],
                53 => ['texto' => 'Ahogo o asfixia al caminar', 'tipo' => 'si_no'],
                54 => ['texto' => 'Tos persistente por más de 1 mes', 'tipo' => 'si_no'],
                55 => ['texto' => 'Pérdida de la conciencia, desmayos o alteración del equilibrio', 'tipo' => 'si_no'],
            ],
        ],

        7 => [
            'titulo' => 'Hábitos o costumbres',
            'preguntas' => [
                56 => ['texto' => 'Fuma (no importa la cantidad ni la frecuencia)', 'tipo' => 'si_no'],
                57 => ['texto' => 'Toma bebidas alcohólicas semanal o quincenalmente (no importa la cantidad)', 'tipo' => 'si_no'],
                58 => ['texto' => 'Practica deportes de choque o de mano (baloncesto, voleibol, fútbol, tenis, squash, ping-pong, béisbol u otros) mínimo 2 veces al mes', 'tipo' => 'si_no'],
                59 => ['texto' => 'Realiza actividad física o deporte menos de 3 veces por semana', 'tipo' => 'si_no'],
            ],
        ],

        8 => [
            'titulo' => 'Condiciones del puesto de trabajo',
            'preguntas' => [
                60 => ['texto' => 'Conoce bien los riesgos a los que está sometido en su puesto de trabajo y las consecuencias para su salud', 'tipo' => 'si_no'],
                61 => ['texto' => 'Ha recibido capacitación sobre el manejo de los riesgos a los que está expuesto', 'tipo' => 'si_no'],
                62 => ['texto' => 'Considera que la iluminación de su puesto de trabajo es adecuada', 'tipo' => 'si_no'],
                63 => ['texto' => 'La temperatura de su sitio de trabajo le ocasiona molestias', 'tipo' => 'si_no'],
                64 => ['texto' => 'El ruido ambiental le permite mantener una conversación sin elevar el tono de voz', 'tipo' => 'si_no'],
                // Los ítems 65 y 67 traen el mismo enunciado en el documento fuente
                // ("En su sitio de trabajo hay presencia de polvo en el ambiente").
                // Se transcriben ambos tal cual, sin fusionarlos, siguiendo la
                // "Nota técnica" del HU-08: pendiente de confirmar con negocio/SST
                // si es un error de captura o dos preguntas distintas.
                65 => ['texto' => 'En su sitio de trabajo hay presencia de polvo en el ambiente', 'tipo' => 'si_no'],
                66 => ['texto' => 'En el sitio de trabajo manipula o está en contacto con productos químicos', 'tipo' => 'si_no'],
                67 => ['texto' => 'En su sitio de trabajo hay presencia de polvo en el ambiente', 'tipo' => 'si_no'],
                68 => ['texto' => 'Existe en su sitio de trabajo riesgo de incendio o explosión', 'tipo' => 'si_no'],
                69 => ['texto' => 'Considera que pisos, techos, paredes o escaleras presentan riesgo para su salud', 'tipo' => 'si_no'],
                70 => ['texto' => 'Existen cables sin entubar, empalmes defectuosos, tomas eléctricas sobrecargadas o transformadores defectuosos', 'tipo' => 'si_no'],
                71 => ['texto' => 'Los sitios de almacenamiento son suficientes, con espacio adecuado y productos bien apilados', 'tipo' => 'si_no'],
                72 => ['texto' => 'Las tareas que desarrolla le exigen realizar movimientos repetitivos', 'tipo' => 'si_no'],
                73 => ['texto' => 'Su labor genera riesgos de seguridad personal (sociales, naturales o públicos por desplazamiento)', 'tipo' => 'si_no'],
                74 => ['texto' => 'Permanece en la misma posición (sentado o de pie) más del 60% de la jornada', 'tipo' => 'si_no'],
                75 => ['texto' => 'La altura de la superficie de trabajo es adecuada a su estatura, silla y labor', 'tipo' => 'si_no'],
                76 => ['texto' => 'Tiene espacio suficiente para variar la posición de piernas y rodillas', 'tipo' => 'si_no'],
                77 => ['texto' => 'La silla es cómoda y permite ajustarla a su medida', 'tipo' => 'si_no'],
                78 => ['texto' => 'Dispone de espacio suficiente para trabajar con holgura', 'tipo' => 'si_no'],
                79 => ['texto' => 'Su trabajo le exige estar frente a la pantalla del computador más del 50% de la jornada', 'tipo' => 'si_no'],
                80 => ['texto' => 'Cree que la ubicación de su pantalla evita la presencia de reflejos', 'tipo' => 'si_no'],
                81 => ['texto' => 'El computador cuenta con filtro que favorezca el manejo de contrastes y disminuya la fatiga visual', 'tipo' => 'si_no'],
                82 => ['texto' => 'Cuenta con atril para ubicar documentos mientras trabaja en el computador', 'tipo' => 'si_no'],
                83 => ['texto' => 'Al finalizar la jornada, el cansancio que siente podría calificarse de "normal"', 'tipo' => 'si_no'],
                84 => ['texto' => 'Considera adecuada la distribución de horario, turnos, descansos, horas extra y pausas', 'tipo' => 'si_no'],
                85 => ['texto' => 'Considera adecuado el tiempo asignado a la tarea que realiza', 'tipo' => 'si_no'],
                86 => ['texto' => 'Puede abandonar el trabajo por unos minutos sin que lo sustituyan', 'tipo' => 'si_no'],
                87 => ['texto' => 'Puede variar el ritmo de trabajo sin perturbar la producción durante la jornada', 'tipo' => 'si_no'],
                88 => ['texto' => 'Las tareas que realiza le producen "sensación de peligrosidad"', 'tipo' => 'si_no'],
                89 => ['texto' => 'El trabajo le permite aplicar sus habilidades y conocimientos', 'tipo' => 'si_no'],
                90 => ['texto' => 'Considera que su trabajo es variado', 'tipo' => 'si_no'],
                91 => ['texto' => 'Su jefe le pide opinión sobre asuntos relacionados con su trabajo', 'tipo' => 'si_no'],
                92 => ['texto' => 'En su puesto de trabajo necesita utilizar elementos de protección personal', 'tipo' => 'si_no'],
                93 => ['texto' => 'Existen baños suficientes en número, con adecuado mantenimiento, dotación y aseo', 'tipo' => 'si_no'],
                94 => ['texto' => 'Cuenta con cocina, cafetería, comedor o sitio de descanso adecuadamente mantenidos, dotados y aseados', 'tipo' => 'si_no'],
                95 => ['texto' => 'La empresa cuenta con agua potable', 'tipo' => 'si_no'],
                96 => ['texto' => 'Existe buen manejo de basuras y desechos', 'tipo' => 'si_no'],
            ],
        ],

        9 => [
            'titulo' => 'Manifestaciones o comportamientos actuales',
            // RN-09: información sensible de tipo psicosocial. Solo se
            // consulta desde la vista de SST, que ya vive dentro del grupo
            // de rutas `role:Administrador|Seguridad` — ver EncuestaMorbilidadController
            // (namespace Seguridad).
            'sensible' => true,
            'preguntas' => [
                97 => ['texto' => 'Dificultades para dormirse (insomnio)', 'tipo' => 'si_no'],
                98 => ['texto' => 'Necesidad de estar solo y desinterés por las cosas', 'tipo' => 'si_no'],
                99 => ['texto' => 'Cansancio, aburrimiento o desgano', 'tipo' => 'si_no'],
                100 => ['texto' => 'Irritabilidad (mal genio), actitudes y pensamientos negativos', 'tipo' => 'si_no'],
                101 => ['texto' => 'Consumo de algún medicamento para los nervios o para dormir', 'tipo' => 'si_no'],
                102 => ['texto' => 'Siente que no puede manejar los problemas de su vida', 'tipo' => 'si_no'],
                103 => ['texto' => 'Dolor de cabeza, dificultad para concentrarse, trastornos intestinales, baja moral, descontento con el trabajo', 'tipo' => 'si_no'],
                104 => ['texto' => 'Tiene dificultad en la comunicación con sus compañeros y jefes', 'tipo' => 'si_no'],
                105 => ['texto' => 'Ha tenido problemas de salud a causa de su trabajo', 'tipo' => 'si_no'],
                106 => ['texto' => 'Tiene problemas con sus familiares', 'tipo' => 'si_no'],
            ],
        ],

        10 => [
            'titulo' => 'Capacitación',
            'preguntas' => [
                107 => ['texto' => 'Temas prioritarios de capacitación', 'tipo' => 'texto_libre'],
            ],
        ],
    ],
];
