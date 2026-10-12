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

            // Home / hero section
            $table->string('home_title')->nullable();
            $table->text('home_subtitle')->nullable();
            $table->string('home_cta_primary')->nullable();
            $table->string('home_cta_secondary')->nullable();
            $table->string('home_hero_image')->nullable();

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
