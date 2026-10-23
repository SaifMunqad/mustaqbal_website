<?php

use App\Support\Home\PageBuilderBackfill;
use Illuminate\Database\Migrations\Migration;

/**
 * Reversible backfill: migrate the legacy home page into the normalized page
 * builder. All logic lives in {@see PageBuilderBackfill} so it is re-runnable
 * from a seeder or the test suite. The legacy tables are left untouched.
 */
return new class extends Migration
{
    public function up(): void
    {
        PageBuilderBackfill::run();
    }

    public function down(): void
    {
        PageBuilderBackfill::revert();
    }
};
