<?php

namespace Database\Seeders;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Enums\SectionType;
use App\Models\Article;
use App\Models\Event;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\Post;
use App\Support\Home\PageLayoutWriter;
use App\Support\Translation\LocalizedContent;
use Illuminate\Database\Seeder;

/**
 * Seeds a ready-made home page layout directly into the unified page builder.
 *
 * Blocks are written through {@see PageLayoutWriter} — the same single write path
 * the visual editor uses — so a seeded layout is byte-for-byte what an admin
 * would have saved by hand: hero and the stats/feature rails from localized
 * copy, two authored bands, and curated rails pointing at *live* content ids.
 *
 * Idempotent: it no-ops once the home page owns builder sections, so reseeding
 * never duplicates rows and never clobbers a layout an admin has curated.
 */
class HomePageBuilderSeeder extends Seeder
{
    private const PAGE_KEY = 'home';

    public function run(): void
    {
        $page = Page::resolve(self::PAGE_KEY, 'Home page');

        if (PageSection::query()->where('page_id', $page->id)->exists()) {
            $this->command?->info('Home page layout already exists, skipping HomePageBuilderSeeder.');

            return;
        }

        PageLayoutWriter::save(self::PAGE_KEY, $this->layout());

        $this->command?->info('Seeded the home page layout in the page builder.');
    }

    /**
     * The staged layout, in display order: the hero and the localized content
     * rails first, then the authored bands, then the curated rails (which resolve
     * to whatever content the earlier seeders created).
     *
     * @return list<array<string, mixed>>
     */
    private function layout(): array
    {
        $codes = collect(Language::activeList())->pluck('code')->all();

        return [
            $this->hero($codes),
            $this->features($codes),
            $this->stats($codes),
            $this->band(SectionType::Banner, 'A Bright Future Starts Here', [
                'body' => 'Discover our programs, upcoming events and the students we are proud of at My School.',
                'image_path' => 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80',
                'cta_label' => 'Explore Programs',
                'cta_url' => '/school/programs',
                'tone' => 'blue',
            ]),
            $this->band(SectionType::Announcement, 'Admissions are now open', [
                'body' => 'Limited seats for the new term — enroll your child today.',
                'cta_label' => 'Enroll now',
                'cta_url' => '/school/enroll',
                'tone' => 'green',
            ]),
            $this->rail(SectionType::Articles, 'Latest Articles', $this->articleIds()),
            $this->rail(SectionType::Events, 'Upcoming Events', $this->eventIds()),
            $this->rail(SectionType::Recognition, 'Recognition Highlights', $this->recognitionIds()),
            ['section_type' => SectionType::Programs->value, 'is_active' => true, 'limit' => 2],
            ['section_type' => SectionType::Jobs->value, 'is_active' => true, 'limit' => 2],
        ];
    }

    /**
     * The hero block: localized copy on the translation rows, the secondary
     * button and tagline in `config`, and the primary link on the parent column.
     *
     * @param  list<string>  $codes
     * @return array<string, mixed>
     */
    private function hero(array $codes): array
    {
        $source = LocalizedContent::homeHero();
        $translations = [];

        foreach ($codes as $code) {
            $entry = $source[$code] ?? null;

            if ($entry === null) {
                continue;
            }

            $translations[$code] = [
                'heading' => $entry['heading'],
                'body' => $entry['body'],
                'cta_label' => $entry['cta_primary'],
            ];
        }

        $default = $source[Language::defaultCode()] ?? reset($source);

        return [
            'section_type' => SectionType::Hero->value,
            'is_active' => true,
            'cta_url' => '/school/programs',
            'config' => [
                // Config is one shared JSON blob, so the secondary button and the
                // tagline follow the default language rather than each row.
                'tagline' => $default['tagline'],
                'cta_secondary' => $default['cta_secondary'],
                'cta_secondary_url' => '/school/contact',
            ],
            'translations' => $this->withDefaultFallback($translations, [
                'heading' => $default['heading'],
                'body' => $default['body'],
                'cta_label' => $default['cta_primary'],
            ]),
        ];
    }

    /**
     * The "why families choose us" rail, with one localized row set per language.
     *
     * @param  list<string>  $codes
     * @return array<string, mixed>
     */
    private function features(array $codes): array
    {
        $source = LocalizedContent::homeFeatures();
        $lists = [];

        foreach ($codes as $code) {
            if (isset($source[$code])) {
                $lists['features'][$code] = $source[$code];
            }
        }

        return [
            'section_type' => SectionType::Features->value,
            'is_active' => true,
            'lists' => $lists,
        ];
    }

    /**
     * The quick-stats rail. `section_list_items` labels live in `title`, which
     * the renderer maps back onto the stat's label.
     *
     * @param  list<string>  $codes
     * @return array<string, mixed>
     */
    private function stats(array $codes): array
    {
        $source = LocalizedContent::homeStats();
        $lists = [];

        foreach ($codes as $code) {
            foreach ($source[$code] ?? [] as $row) {
                $lists['stats'][$code][] = [
                    'value' => $row['value'],
                    'title' => $row['label'],
                ];
            }
        }

        return [
            'section_type' => SectionType::Stats->value,
            'is_active' => true,
            'lists' => $lists,
        ];
    }

    /**
     * An authored band (banner / announcement) whose English copy is the source
     * row and whose secondary languages come from the glossary.
     *
     * @param  array<string, mixed>  $english  heading is the glossary key
     * @return array<string, mixed>
     */
    private function band(SectionType $type, string $englishHeading, array $english): array
    {
        $source = [
            'heading' => $english['heading'] ?? $englishHeading,
            'body' => $english['body'] ?? '',
            'cta_label' => $english['cta_label'] ?? '',
        ];

        $translations = ['en' => $source];

        foreach (LocalizedContent::homeBands()[$englishHeading] ?? [] as $code => $entry) {
            $translations[$code] = [
                'heading' => $entry['heading'],
                'body' => $entry['body'],
                'cta_label' => $entry['cta_label'],
            ];
        }

        return [
            'section_type' => $type->value,
            'is_active' => true,
            'image_path' => $english['image_path'] ?? null,
            'cta_url' => $english['cta_url'] ?? null,
            'tone' => $english['tone'] ?? 'default',
            'translations' => $this->withDefaultFallback($translations, $source),
        ];
    }

    /**
     * A curated rail: explicit picks keep the admin's order, and the localized
     * title is authored text rather than an i18n key.
     *
     * @param  list<int>  $ids
     * @return array<string, mixed>
     */
    private function rail(SectionType $type, string $englishTitle, array $ids): array
    {
        $translations = ['en' => ['title' => $englishTitle]];

        foreach (LocalizedContent::homeRailTitles()[$englishTitle] ?? [] as $code => $title) {
            $translations[$code] = ['title' => $title];
        }

        return [
            'section_type' => $type->value,
            'is_active' => true,
            'limit' => 3,
            'items' => array_map(
                static fn (int $id): array => ['id' => $id, 'type' => $type->itemType()],
                $ids,
            ),
            'translations' => $this->withDefaultFallback($translations, ['title' => $englishTitle]),
        ];
    }

    /**
     * Guarantee the page's default language always has an authored row: a site
     * seeded in a language the glossary has no entry for would otherwise render
     * an empty block, because rows for unknown languages are dropped on write.
     *
     * @param  array<string, array<string, string>>  $translations
     * @param  array<string, string>  $english
     * @return array<string, array<string, string>>
     */
    private function withDefaultFallback(array $translations, array $english): array
    {
        $default = Language::defaultCode();

        if ($default !== '' && ! isset($translations[$default])) {
            $translations[$default] = $english;
        }

        return $translations;
    }

    /** @return list<int> */
    private function articleIds(): array
    {
        return Article::query()
            ->where('is_published', true)
            ->whereNotNull('published_at')
            ->latest('published_at')
            ->limit(3)
            ->pluck('id')
            ->all();
    }

    /** @return list<int> */
    private function eventIds(): array
    {
        return Event::query()
            ->visibleTo(null)
            ->upcoming()
            ->limit(3)
            ->pluck('id')
            ->all();
    }

    /** @return list<int> */
    private function recognitionIds(): array
    {
        return Post::query()
            ->where('visibility', PostVisibility::Public->value)
            ->whereIn('type', array_map(
                static fn (PostType $type): string => $type->value,
                PostType::recognitionTypes(),
            ))
            ->latest()
            ->limit(3)
            ->pluck('id')
            ->all();
    }
}
