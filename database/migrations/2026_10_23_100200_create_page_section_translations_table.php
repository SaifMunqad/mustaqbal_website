<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-language localized scalars for a block (section title + authored
     * heading/body/call-to-action label). Follows the shared HasTranslations
     * pattern keyed by (page_section_id + language_id).
     */
    public function up(): void
    {
        Schema::create('page_section_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('heading')->nullable();
            $table->text('body')->nullable();
            $table->string('cta_label')->nullable();
            $table->timestamps();

            $table->unique(['page_section_id', 'language_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_section_translations');
    }
};
