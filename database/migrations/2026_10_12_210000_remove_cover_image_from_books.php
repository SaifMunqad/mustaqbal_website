<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A book's image is now its thumbnail: auto-generated from the uploaded PDF's
 * first page, or manually replaced by the admin. The separate, purchase-era
 * `cover_image` column is no longer used anywhere and is removed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn('cover_image');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('cover_image')->nullable()->after('description');
        });
    }
};
