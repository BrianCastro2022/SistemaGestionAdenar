<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // innodb_strict_mode=1 en este servidor calcula el tamaño de fila en el
        // peor caso (COMPACT) aunque innodb_default_row_format sea DYNAMIC.
        // Desactivamos strict_mode solo para esta sesión, creamos la tabla y
        // lo restauramos inmediatamente.
        DB::statement('SET SESSION innodb_strict_mode=0');

        DB::statement('
            CREATE TABLE `checklist_vehiculos` (
              `id`                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
              `id_form`                  VARCHAR(191) NOT NULL UNIQUE,
              `estado`                   VARCHAR(50)  NULL,
              `fecha`                    DATETIME     NULL,
              `fecha_fin`                DATETIME     NULL,
              `id_centro`                VARCHAR(50)  NULL,
              `id_regional`              VARCHAR(50)  NULL,
              `regional`                 VARCHAR(100) NULL,
              `centro`                   VARCHAR(100) NULL,
              `operacion`                VARCHAR(100) NULL,
              `cedula_conductor`         VARCHAR(20)  NULL,
              `placa_vehiculo`           VARCHAR(20)  NULL,
              `odometro`                 VARCHAR(30)  NULL,
              `salud_descanso`           VARCHAR(50)  NULL,
              `libre_medicamentos`       VARCHAR(50)  NULL,
              `fugas`                    VARCHAR(50)  NULL,
              `testigos_presion_aire`    VARCHAR(50)  NULL,
              `freno_parqueo`            VARCHAR(50)  NULL,
              `kit_reparto`              VARCHAR(50)  NULL,
              `inventario`               VARCHAR(50)  NULL,
              `capacidad_vehiculo`       VARCHAR(50)  NULL,
              `condiciones_operar`       VARCHAR(50)  NULL,
              `documentos_operar`        VARCHAR(50)  NULL,
              `licencia_vigente`         VARCHAR(50)  NULL,
              `licencia_original`        VARCHAR(50)  NULL,
              `tecnomecanica`            VARCHAR(50)  NULL,
              `soat_vigente`             VARCHAR(50)  NULL,
              `kit_totalidad`            VARCHAR(50)  NULL,
              `repuestos_buen_estado`    VARCHAR(50)  NULL,
              `extintor`                 VARCHAR(50)  NULL,
              `extintor_vigente`         VARCHAR(50)  NULL,
              `botiquin_condiciones`     VARCHAR(50)  NULL,
              `linterna_condiciones`     VARCHAR(50)  NULL,
              `kit_basico`               VARCHAR(50)  NULL,
              `niveles_totalidad`        VARCHAR(50)  NULL,
              `combustible_suficiente`   VARCHAR(50)  NULL,
              `nivel_combustible`        VARCHAR(50)  NULL,
              `liquido_embrague`         VARCHAR(50)  NULL,
              `refrigerante_estado`      VARCHAR(50)  NULL,
              `aceite_estado`            VARCHAR(50)  NULL,
              `estado_hidraulico`        VARCHAR(50)  NULL,
              `aceite_caja`              VARCHAR(50)  NULL,
              `agua_limpiabrisas`        VARCHAR(50)  NULL,
              `cumple_llantas`           VARCHAR(50)  NULL,
              `bandas_rodamientos`       VARCHAR(50)  NULL,
              `deformaciones_costados`   VARCHAR(50)  NULL,
              `labrado_profundidad`      VARCHAR(50)  NULL,
              `cumple_visibilidad`       VARCHAR(50)  NULL,
              `estado_panoramico`        VARCHAR(50)  NULL,
              `estado_retrovisores`      VARCHAR(50)  NULL,
              `estado_limpiabrisas`      VARCHAR(50)  NULL,
              `estado_cinturones`        VARCHAR(50)  NULL,
              `estado_colapies`          VARCHAR(50)  NULL,
              `cerrar_fuera`             VARCHAR(50)  NULL,
              `estado_dashcam`           VARCHAR(50)  NULL,
              `estado_vidrios`           VARCHAR(50)  NULL,
              `cumple_luces`             VARCHAR(50)  NULL,
              `luces_freno`              VARCHAR(50)  NULL,
              `estado_principales`       VARCHAR(50)  NULL,
              `luces_reserva`            VARCHAR(50)  NULL,
              `luces_direccionales`      VARCHAR(50)  NULL,
              `luces_estacionarias`      VARCHAR(50)  NULL,
              `luces_laterales`          VARCHAR(50)  NULL,
              `estado_pito`              VARCHAR(50)  NULL,
              `estado_pito_reserva`      VARCHAR(50)  NULL,
              `cumple_audible`           VARCHAR(50)  NULL,
              `cumple_carroceria`        VARCHAR(50)  NULL,
              `estado_correas`           VARCHAR(50)  NULL,
              `estado_parales`           VARCHAR(50)  NULL,
              `estado_cortinas`          VARCHAR(50)  NULL,
              `estado_chapas`            VARCHAR(50)  NULL,
              `cumple_carretilla`        VARCHAR(50)  NULL,
              `cuenta_etiqueta`          VARCHAR(50)  NULL,
              `llantas_rodamientos_dos`  VARCHAR(50)  NULL,
              `estado_carretilla_dos`    VARCHAR(50)  NULL,
              `carretilla_dos`           VARCHAR(50)  NULL,
              `etiqueta`                 VARCHAR(50)  NULL,
              `estado_rodamiento`        VARCHAR(50)  NULL,
              `estado_carretilla_uno`    VARCHAR(50)  NULL,
              `carretilla_uno`           VARCHAR(50)  NULL,
              `observaciones`            TEXT         NULL,
              `firma_conductor`          VARCHAR(191) NULL,
              `conductor_operar`         VARCHAR(100) NULL,
              `vehiculo_operar`          VARCHAR(30)  NULL,
              `vehiculo_bitren`          VARCHAR(30)  NULL,
              `estado_bitren`            VARCHAR(50)  NULL,
              `nombre_flota`             VARCHAR(100) NULL,
              `apellido_flota`           VARCHAR(100) NULL,
              `firma_responsable`        VARCHAR(191) NULL,
              `estado_form`              VARCHAR(50)  NULL,
              `cumpl`                    DECIMAL(8,2) NULL,
              `meta_td`                  DECIMAL(8,2) NULL,
              `tiempo_ejecucion`         VARCHAR(50)  NULL,
              `mes`                      TINYINT UNSIGNED NULL,
              `semana`                   TINYINT UNSIGNED NULL,
              `anio`                     SMALLINT UNSIGNED NULL,
              `dia`                      TINYINT UNSIGNED NULL,
              `meta`                     DECIMAL(8,2) NULL,
              `cumpl_meta`               DECIMAL(8,2) NULL,
              `created_at`               TIMESTAMP NULL,
              `updated_at`               TIMESTAMP NULL,
              INDEX `idx_fecha_placa`  (`fecha`, `placa_vehiculo`),
              INDEX `idx_cedula_fecha` (`cedula_conductor`, `fecha`)
            ) ENGINE=InnoDB
              ROW_FORMAT=DYNAMIC
              DEFAULT CHARSET=utf8mb4
              COLLATE=utf8mb4_unicode_ci
        ');

        DB::statement('SET SESSION innodb_strict_mode=1');
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_vehiculos');
    }
};
