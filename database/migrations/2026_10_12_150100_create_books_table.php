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
            $table->unsignedSmallInteger('published_year')->nullable();
            // The company/producer that published the book.
            $table->string('publisher')->nullable();
            $table->string('isbn')->nullable();
            $table->text('description')->nullable();
            $table->json('images')->nullable();
            // Path (on the public disk) of the downloadable PDF.
            $table->string('file_path')->nullable();
            // Path (on the public disk) of the thumbnail generated from the PDF's first page.
            $table->string('thumbnail_path')->nullable();
            $table->foreignId('book_category_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index('book_category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
