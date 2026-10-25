<?php

namespace Database\Seeders;

use App\Enums\SectionType;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Support\Home\PageLayoutWriter;
use App\Support\Translation\LocalizedContent;
use Illuminate\Database\Seeder;

/**
 * Seeds the public Contact page directly into the unified page builder.
 *
 * The design is the same composition the page has always had — an intro hero,
 * the inquiry form beside the contact-details column, then the location map —
 * expressed as ordinary blocks so every part of it is editable in the builder.
 * The details and the map read their data from Site Settings at render time; the
 * blocks only decide placement.
 *
 * Idempotent: it no-ops once the Contact page owns builder sections.
 */
class ContactPageBuilderSeeder extends Seeder
{
    private const PAGE_KEY = 'contact';

    public function run(): void
    {
        $page = Page::resolve(self::PAGE_KEY, 'Contact page');

        if (PageSection::query()->where('page_id', $page->id)->exists()) {
            $this->command?->info('Contact page layout already exists, skipping ContactPageBuilderSeeder.');

            return;
        }

        PageLayoutWriter::save(self::PAGE_KEY, [
            [
                'section_type' => SectionType::Hero->value,
                'is_active' => true,
                'cta_url' => '/school/enroll',
                'translations' => $this->heroTranslations(),
            ],
            // Half-width spans on desktop reproduce the two-column form/details
            // row; the map stays full width underneath.
            [
                'section_type' => SectionType::ContactForm->value,
                'is_active' => true,
                'span_lg' => 6,
            ],
            [
                'section_type' => SectionType::ContactDetails->value,
                'is_active' => true,
                'span_lg' => 6,
            ],
            [
                'section_type' => SectionType::Map->value,
                'is_active' => true,
            ],
        ]);

        $this->command?->info('Seeded the contact page layout in the page builder.');
    }

    /**
     * The hero copy for every active language the glossary covers, always with a
     * row for the default language so the page is never empty.
     *
     * @return array<string, array<string, string>>
     */
    private function heroTranslations(): array
    {
        $source = LocalizedContent::contactIntro();
        $default = Language::defaultCode();
        $fallback = $source[$default] ?? reset($source);

        $translations = [];

        foreach (collect(Language::activeList())->pluck('code') as $code) {
            $entry = $source[$code] ?? $fallback;

            $translations[$code] = [
                'heading' => $entry['heading'],
                'body' => $entry['body'],
                'cta_label' => $entry['cta_primary'],
            ];
        }

        return $translations;
    }
}
