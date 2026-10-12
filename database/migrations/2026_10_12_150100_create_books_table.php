<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('author')->nullable();
            $table->string('isbn')->nullable();
            $table->text('description')->nullable();
            $table->decimal('price_afn', 10, 2)->default(0);
            $table->unsignedInteger('stock')->default(0);
            $table->string('cover_image')->nullable();
            $table->json('images')->nullable();
            $table->foreignId('book_category_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->index(['is_available', 'book_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
