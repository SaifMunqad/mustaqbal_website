<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-language copies of the localized Site Settings fields, mirroring the
     * shared `programs` / `program_translations` pattern. The parent `site_settings`
     * row keeps the default-language values as the source of truth (no columns
     * are dropped here), exactly like `book_categories`; a missing translation
     * row simply falls back to the parent column at read time.
     */
    public function up(): void
    {
        Schema::create('site_setting_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_setting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();

            // Localized branding (brand name + short name) so each language can
            // present its own brand wording; the parent keeps the default-language
            // values as the fallback source of truth.
            $table->string('brand_name')->nullable();
            $table->string('brand_short_name')->nullable();

            $table->string('tagline')->nullable();
            $table->string('home_title')->nullable();
            $table->text('home_subtitle')->nullable();
            $table->string('home_cta_primary')->nullable();
            $table->string('home_cta_secondary')->nullable();
            $table->string('footer_text')->nullable();
            // Localized, admin-curated home lists. Stored per language (values /
            // icon keys repeat) so each language fully defines its home content.
            $table->json('home_stats')->nullable();
            $table->json('home_features')->nullable();

            $table->timestamps();

            $table->unique(['site_setting_id', 'language_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_setting_translations');
    }
};
