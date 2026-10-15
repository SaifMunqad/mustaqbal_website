<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The favicon is now derived automatically from the logo (see
     * {@see \App\Services\FaviconService}), so the dedicated upload column is no
     * longer used and can be dropped.
     */
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn('favicon_url');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->string('favicon_url')->nullable()->after('logo_url');
        });
    }
};
