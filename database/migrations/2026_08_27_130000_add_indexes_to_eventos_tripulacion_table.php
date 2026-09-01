<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('eventos_tripulacion', function (Blueprint $table) {
            if (!Schema::hasColumn('eventos_tripulacion', 'placa') === false) {
                // Índice en documento para búsquedas por cédula
                if (!collect(\DB::select("SHOW INDEX FROM eventos_tripulacion WHERE Key_name = 'idx_et_documento'"))->count()) {
                    $table->index('documento', 'idx_et_documento');
                }
                // Índice en doc_transporte
                if (!collect(\DB::select("SHOW INDEX FROM eventos_tripulacion WHERE Key_name = 'idx_et_doc_transporte'"))->count()) {
                    $table->index('doc_transporte', 'idx_et_doc_transporte');
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('eventos_tripulacion', function (Blueprint $table) {
            $table->dropIndexIfExists('idx_placa');
            $table->dropIndexIfExists('idx_documento');
            $table->dropIndexIfExists('idx_doc_transporte');
            $table->dropIndexIfExists('idx_fecha_placa');
        });
    }
};
