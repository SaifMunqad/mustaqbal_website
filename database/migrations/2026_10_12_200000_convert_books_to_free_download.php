<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The bookstore is no longer a shop: books are offered for free, direct
 * download. This removes every purchase-related column/table and adds the
 * metadata the free library needs (publish year, producing company, the PDF
 * file and its generated thumbnail).
 *
 * NOTE: this is destructive (drops the orders/order_items tables and the
 * purchase columns on books). It is authored here but must be run manually.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Drop order tables first (order_items references orders + books).
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');

        Schema::table('books', function (Blueprint $table) {
            // The old index depends on is_available, which is being removed.
            $table->dropIndex(['is_available', 'book_category_id']);
        });

        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn(['price_afn', 'stock', 'is_available']);
        });

        Schema::table('books', function (Blueprint $table) {
            $table->unsignedSmallInteger('published_year')->nullable()->after('author');
            // The company/producer that published the book.
            $table->string('publisher')->nullable()->after('published_year');
            // Path (on the public disk) of the downloadable PDF.
            $table->string('file_path')->nullable()->after('images');
            // Path (on the public disk) of the thumbnail generated from the PDF's first page.
            $table->string('thumbnail_path')->nullable()->after('file_path');

            $table->index('book_category_id');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex(['book_category_id']);
            $table->dropColumn(['published_year', 'publisher', 'file_path', 'thumbnail_path']);
        });

        Schema::table('books', function (Blueprint $table) {
            $table->decimal('price_afn', 10, 2)->default(0);
            $table->unsignedInteger('stock')->default(0);
            $table->boolean('is_available')->default(true);

            $table->index(['is_available', 'book_category_id']);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->string('payment_method')->default('cash_on_delivery');
            $table->string('payment_status')->default('unpaid');
            $table->decimal('total', 10, 2)->default(0);
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('book_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('author')->nullable();
            $table->decimal('unit_price', 10, 2);
            $table->unsignedInteger('quantity');
            $table->decimal('line_total', 10, 2);
            $table->timestamps();
        });
    }
};
