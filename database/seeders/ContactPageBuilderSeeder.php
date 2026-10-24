<?php

namespace Database\Seeders;

use App\Support\Home\ContactPageBackfill;
use Illuminate\Database\Seeder;

/**
 * Mirrors the seeded Contact page into the normalized page builder.
 *
 * The Contact page is authored in the unified builder, but its seed data lives
 * in `site_pages`. Running this after the contact page is created keeps a fresh
 * `migrate:fresh --seed` opening the contact editor with the current design
 * (intro, inquiry form, Site Settings contact column, map).
 *
 * Idempotent: {@see ContactPageBackfill::run()} no-ops once the Contact page
 * already has builder sections, so reseeding never duplicates or clobbers.
 */
class ContactPageBuilderSeeder extends Seeder
{
    public function run(): void
    {
        ContactPageBackfill::run();

        $this->command?->info('Page builder synced from the seeded contact layout.');
    }
}
