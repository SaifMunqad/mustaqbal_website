<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->boolean('featured')->default(false)->after('job_apply_url');
            $table->timestamp('featured_from')->nullable()->after('featured');
            $table->timestamp('featured_until')->nullable()->after('featured_from');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['featured', 'featured_from', 'featured_until']);
        });
    }
};
