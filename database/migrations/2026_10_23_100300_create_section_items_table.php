<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Curated references for a block, replacing the opaque `config.item_ids` JSON
     * array. Rows are indexable and cascade-safe: the (item_type, item_id) index
     * answers "which pages show this source record", while `sort_order` preserves
     * the admin's explicit pick order. Content stays live by reference — resolved
     * through each source model's visibility rules at read time, never copied.
     */
    public function up(): void
    {
        Schema::create('section_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_section_id')->constrained()->cascadeOnDelete();
            $table->string('item_type');     // 'article', 'event', 'post', 'program', 'job'
            $table->unsignedBigInteger('item_id');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['page_section_id', 'item_type', 'item_id'], 'section_items_unique');
            $table->index(['item_type', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('section_items');
    }
};
