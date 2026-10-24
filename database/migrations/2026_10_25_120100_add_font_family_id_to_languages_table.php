<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-language typeface. Nullable: a language without a family falls back to
     * the built-in stack in `resources/css/app.css`.
     *
     * The column is indexed but deliberately carries no foreign key constraint:
     * SQLite cannot add one to an existing table, and the dashboard already
     * refuses to delete a family that a language still uses.
     */
    public function up(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            $table->unsignedBigInteger('font_family_id')->nullable()->after('dir')->index();
        });
    }

    public function down(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            $table->dropIndex(['font_family_id']);
            $table->dropColumn('font_family_id');
        });
    }
};
