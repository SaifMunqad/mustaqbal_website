<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('program_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description');
            $table->timestamps();

            $table->unique(['program_id', 'language_id']);
        });

        Schema::create('program_type_translations', function (Blueprint $table) {
            $table->id();
            $table->string('program_type');
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->timestamps();

            $table->unique(['program_type', 'language_id']);
            $table->index('program_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_type_translations');
        Schema::dropIfExists('program_translations');
        Schema::dropIfExists('languages');
    }
};

