<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            $table->string('dir', 3)->default('ltr')->after('name');
            $table->boolean('is_active')->default(true)->after('dir');
            $table->boolean('is_default')->default(false)->after('is_active');
            $table->unsignedInteger('sort_order')->default(0)->after('is_default');
        });

        // Mark English as the default fallback language so content without a
        // translation gracefully resolves to it.
        DB::table('languages')
            ->where('code', 'en')
            ->update(['is_default' => true, 'dir' => 'ltr']);

        // Right-to-left scripts get their direction set here as well.
        DB::table('languages')
            ->whereIn('code', ['ps', 'fa_AF', 'ar'])
            ->update(['dir' => 'rtl']);
    }

    public function down(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            $table->dropColumn(['dir', 'is_active', 'is_default', 'sort_order']);
        });
    }
};
