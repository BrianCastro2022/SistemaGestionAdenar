<?php

<<<<<<< HEAD
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('glossary_terms', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('definicion');
            $table->string('categoria')->index();
            $table->string('pregunta_numero')->nullable();
            $table->text('representacion')->nullable();
            $table->string('enlaces_de_interes')->nullable();
            $table->enum('source', ['manual', 'scraped'])->default('manual');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Índices para búsqueda rápida
            $table->index(['categoria', 'nombre']);
            $table->unique(['nombre', 'categoria']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('glossary_terms');
    }
};

