<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A language can point at one of the curated Google Fonts instead of an
     * uploaded family. The two columns are mutually exclusive: assigning one
     * clears the other in {@see \App\Http\Controllers\Dashboard\DashboardFontController}.
     */
    public function up(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            $table->string('google_font', 40)->nullable()->after('font_family_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            $table->dropIndex(['google_font']);
            $table->dropColumn('google_font');
        });
    }
};
