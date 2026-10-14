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
            // Browser tab icon uploaded from Site Settings (falls back to /favicon.ico).
            $table->string('favicon_url')->nullable();

            // Home / hero section
            $table->string('home_title')->nullable();
            $table->text('home_subtitle')->nullable();
            $table->string('home_cta_primary')->nullable();
            $table->string('home_cta_secondary')->nullable();
            $table->string('home_hero_image')->nullable();
            // Admin-editable home lists stored as JSON arrays on the single row:
            // the quick-stats bar and the "why choose us" feature grid.
            $table->json('home_stats')->nullable();
            $table->json('home_features')->nullable();

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
