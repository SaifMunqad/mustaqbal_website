<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds explicit coordinate fields so an admin can drop a Google Maps pin and
 * have the location persisted as data (latitude/longitude/zoom) rather than
 * only as a hand-pasted embed URL. The embed URL is derived from these values.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->decimal('map_latitude', 10, 7)->nullable()->after('address');
            $table->decimal('map_longitude', 10, 7)->nullable()->after('map_latitude');
            $table->unsignedTinyInteger('map_zoom')->nullable()->default(15)->after('map_longitude');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['map_latitude', 'map_longitude', 'map_zoom']);
        });
    }
};
