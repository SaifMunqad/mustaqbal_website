<?php

namespace Database\Seeders;

use App\Support\Home\AboutPageBackfill;
use Illuminate\Database\Seeder;

/**
 * Mirrors the seeded About page into the normalized page builder.
 *
 * The About page is authored in the unified builder, but its legacy content
 * lives in `site_pages`. Running this after {@see AboutPageSeeder} keeps a
 * fresh `migrate:fresh --seed` opening the builder with real content instead of
 * an empty canvas.
 *
 * Idempotent: {@see AboutPageBackfill::run()} no-ops once the About page
 * already has builder sections, so reseeding never duplicates or clobbers.
 */
class AboutPageBuilderSeeder extends Seeder
{
    public function run(): void
    {
        AboutPageBackfill::run();

        $this->command?->info('Page builder synced from the seeded about layout.');
    }
}
