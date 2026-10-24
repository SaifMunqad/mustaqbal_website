<?php

namespace Database\Seeders;

use App\Support\Home\PageBuilderBackfill;
use Illuminate\Database\Seeder;

/**
 * Populates the normalized page builder (pages / page_sections / child stores)
 * from the legacy home layout that the earlier seeders just wrote.
 *
 * The backfill *migration* runs before any seed data exists, so on a fresh
 * `migrate:fresh --seed` the builder tables would be empty and the visual
 * editor (which reads the builder) would show nothing while the legacy home
 * page had content. Running the backfill here — after SiteSettings and
 * HomeSectionSeeder — keeps the builder in sync with the seeded layout.
 *
 * Idempotent: {@see PageBuilderBackfill::run()} no-ops once the home page
 * already has builder sections, so reseeding never duplicates or clobbers.
 * The About page has its own seeder ({@see AboutPageBuilderSeeder}).
 */
class PageBuilderSeeder extends Seeder
{
    public function run(): void
    {
        PageBuilderBackfill::run();
        PageBuilderBackfill::addDefaultRails();

        $this->command?->info('Page builder synced from the seeded home layout.');
    }
}
