<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Branding colors for the public site. The page background is deliberately
     * absent: it stays frozen in app.css (white in light mode, dark gray in dark
     * mode) and these colors only paint the layers above it.
     */
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            // Single source of the derived palette (see App\Support\Theme\BrandPalette).
            $table->string('brand_color', 7)->nullable()->after('logo_url');
            // Optional second brand color; the palette auto-derives one when null.
            $table->string('accent_color', 7)->nullable()->after('brand_color');
            // How strongly sections/cards are tinted: subtle | medium | bold.
            $table->string('tint_depth', 10)->default('subtle')->after('accent_color');
            // Light-on-dark logo for inverted bands and the colored footer.
            $table->string('reverse_logo_url')->nullable()->after('tint_depth');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['brand_color', 'accent_color', 'tint_depth', 'reverse_logo_url']);
        });
    }
};
