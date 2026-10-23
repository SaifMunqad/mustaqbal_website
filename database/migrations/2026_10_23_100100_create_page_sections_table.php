<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One ordered block instance on a page. Everything the old `config` JSON bag
     * crammed together is split into categories: shared presentation lives in
     * real, typed columns; localized text lives in page_section_translations;
     * curated references live in section_items; localized lists live in
     * section_list_items. `config` stays only as a narrow per-type escape hatch.
     *
     * Responsive placement is data-driven via the `span_*` columns (1-12 of a
     * 12-column grid, per breakpoint); ordering within the flow is `sort_order`.
     */
    public function up(): void
    {
        Schema::create('page_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->string('section_type');
            $table->string('zone')->default('main');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            // Shared, non-localized presentation as typed columns (was fat config JSON).
            $table->string('image_path')->nullable();
            $table->string('cta_url')->nullable();
            $table->string('tone')->default('default');
            $table->unsignedTinyInteger('columns')->nullable();
            $table->unsignedTinyInteger('limit')->nullable();

            // Responsive, self-adaptive grid spans (1-12); null falls back to the
            // block type's registry default at render time.
            $table->unsignedTinyInteger('span_lg')->nullable();
            $table->unsignedTinyInteger('span_md')->nullable();
            $table->unsignedTinyInteger('span_sm')->nullable();

            // Only the occasional per-type boolean/enum that doesn't warrant a column.
            $table->json('config')->nullable();

            $table->timestamps();

            $table->index(['page_id', 'zone', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_sections');
    }
};
