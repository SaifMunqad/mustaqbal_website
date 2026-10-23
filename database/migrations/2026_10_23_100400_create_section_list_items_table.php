<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ordered, localized collections for a block, replacing the JSON feature/stat
     * arrays stored on SiteSettings. Generic typed columns are reused across every
     * list shape (features = icon/title/description; stats = value/title; faqs =
     * title/description). `item_group` categorizes multiple lists on one block;
     * a null `language_id` marks a shared, non-localized row.
     */
    public function up(): void
    {
        Schema::create('section_list_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('item_group');    // 'features', 'stats', 'faqs', ...
            $table->unsignedInteger('sort_order')->default(0);

            $table->string('value')->nullable();       // stats number
            $table->string('title')->nullable();        // stats label / feature title / faq question
            $table->text('description')->nullable();    // feature description / faq answer
            $table->string('icon')->nullable();
            $table->string('image_path')->nullable();
            $table->string('url')->nullable();

            $table->timestamps();

            $table->index(['page_section_id', 'item_group', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('section_list_items');
    }
};
