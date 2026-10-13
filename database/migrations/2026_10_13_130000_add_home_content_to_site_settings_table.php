<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Admin-editable home page content that is a list rather than a single
     * value: the quick-stats bar and the "why choose us" feature grid. Both are
     * stored as JSON arrays on the single site_settings row so they can be
     * managed from the Site Settings page alongside the rest of the home hero.
     */
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->json('home_stats')->nullable()->after('home_hero_image');
            $table->json('home_features')->nullable()->after('home_stats');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['home_stats', 'home_features']);
        });
    }
};
