<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->string('dir', 3)->default('ltr');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Dari is the system's default language: created here (not in a seeder)
        // so a freshly migrated database always has the default language row even
        // before any seeding. Secondary languages (English, Pashto) are added by
        // the seeder. `fa_AF` is the shared code used across the codebase.
        DB::table('languages')->insert([
            'code' => 'fa_AF',
            'name' => 'Dari',
            'dir' => 'rtl',
            'is_active' => true,
            'is_default' => true,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

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

