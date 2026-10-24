<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Admin-uploaded font families.
     *
     * A family is split from its files so a single family can ship several
     * weights (400/500/600/700); each file becomes one `@font-face` rule. The
     * browser then uses real bold text instead of synthesising it.
     */
    public function up(): void
    {
        Schema::create('fonts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('font_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('font_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('weight')->default(400);
            $table->string('style', 8)->default('normal');
            $table->string('path');
            $table->string('format', 16)->default('woff2');
            $table->timestamps();

            $table->unique(['font_id', 'weight', 'style']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('font_files');
        Schema::dropIfExists('fonts');
    }
};
