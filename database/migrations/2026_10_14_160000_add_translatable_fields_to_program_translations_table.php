<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Extend the programs translation table so per-language content can store
     * the human-readable schedule, age band and classroom label alongside the
     * existing name/description. The parent `programs` row keeps holding the
     * default-language values as the source of truth (mirror pattern), so these
     * columns are nullable and only alternate languages (or an explicitly edited
     * default) populate them. Empty values fall back to the parent at read time.
     */
    public function up(): void
    {
        Schema::table('program_translations', function (Blueprint $table) {
            $table->string('schedule')->nullable()->after('description');
            $table->string('age_recommendation')->nullable()->after('schedule');
            $table->string('classroom_number')->nullable()->after('age_recommendation');
        });
    }

    public function down(): void
    {
        Schema::table('program_translations', function (Blueprint $table) {
            $table->dropColumn(['schedule', 'age_recommendation', 'classroom_number']);
        });
    }
};
