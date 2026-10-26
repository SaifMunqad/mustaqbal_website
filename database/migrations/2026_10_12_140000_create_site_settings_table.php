<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();

            // Branding
            $table->string('brand_name');
            $table->string('brand_short_name');
            $table->string('tagline')->nullable();
            $table->string('logo_url')->nullable();
            // Branding colors for the public site. The page background is deliberately
            // absent: it stays frozen in app.css and these colors only paint the layers
            // above it. See App\Support\Theme\BrandPalette for the derived palette.
            $table->string('brand_color', 7)->nullable();
            // Optional second brand color; the palette auto-derives one when null.
            $table->string('accent_color', 7)->nullable();
            // How strongly sections/cards are tinted: subtle | medium | bold.
            $table->string('tint_depth', 10)->default('subtle');
            // Light-on-dark logo for inverted bands and the colored footer.
            $table->string('reverse_logo_url')->nullable();

            // Contact details
            $table->string('contact_email')->nullable();
            $table->string('contact_phone_primary')->nullable();
            $table->string('contact_phone_secondary')->nullable();
            $table->string('address')->nullable();
            // Explicit coordinates so an admin can drop a Google Maps pin and have
            // the location persisted as data (latitude/longitude/zoom) rather than
            // only as a hand-pasted embed URL. The embed URL is derived from these.
            $table->decimal('map_latitude', 10, 7)->nullable();
            $table->decimal('map_longitude', 10, 7)->nullable();
            $table->unsignedTinyInteger('map_zoom')->nullable()->default(15);
            $table->text('map_embed_url')->nullable();

            // Social links
            $table->string('social_facebook')->nullable();
            $table->string('social_instagram')->nullable();
            $table->string('social_twitter')->nullable();
            $table->string('social_youtube')->nullable();
            $table->string('social_whatsapp')->nullable();

            // Footer
            $table->string('footer_text')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
