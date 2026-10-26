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
            // Per-language typeface. Nullable: a language without a family falls back to
            // the built-in stack in `resources/css/app.css`. Indexed but deliberately
            // without a foreign key: SQLite cannot add one to an existing table, and the
            // dashboard already refuses to delete a family a language still uses.
            $table->unsignedBigInteger('font_family_id')->nullable()->index();
            // A language can point at one of the curated Google Fonts instead of an
            // uploaded family. The two columns are mutually exclusive: assigning one
            // clears the other (see DashboardFontController).
            $table->string('google_font', 40)->nullable()->index();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Dari is the system's default language: created here (not in a seeder)
        // so a freshly migrated database always has the default language row even
        // before any seeding. Seeding adds no other languages, so Dari stays the
        // only locale. `fa_AF` is the shared code used across the codebase.
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
            // Per-language schedule, age band and classroom label. The parent `programs`
            // row keeps holding the default-language values as the source of truth
            // (mirror pattern), so these are nullable and empty values fall back to the
            // parent at read time.
            $table->string('schedule')->nullable();
            $table->string('age_recommendation')->nullable();
            $table->string('classroom_number')->nullable();
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

