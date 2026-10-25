<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Event;
use App\Models\Job;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\SitePage;
use Database\Seeders\AboutPageBuilderSeeder;
use Database\Seeders\EventSeeder;
use Database\Seeders\HomePageBuilderSeeder;
use Database\Seeders\JobSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards the seeder/factory fix that populates every localized table for ALL
 * active languages, not just the default. Each translated entity must end up
 * with an English (default) row plus a Pashto and a Dari row carrying real,
 * in-language content — so no secondary language silently falls back to English
 * on the public site after a fresh seed. Page-builder blocks are held to the
 * same rule: the builder is the only home of page copy now that the legacy
 * `site_pages` composition is gone.
 */
class SeededTranslationCoverageTest extends TestCase
{
    use RefreshDatabase;

    private const CODES = ['en', 'ps', 'fa_AF'];

    protected function setUp(): void
    {
        parent::setUp();

        // updateOrCreate: Dari (fa_AF) already exists from its migration insert,
        // so seeding fixtures here must be idempotent rather than a raw create.
        Language::query()->updateOrCreate(['code' => 'en'], ['name' => 'English', 'dir' => 'ltr', 'is_active' => true, 'is_default' => true, 'sort_order' => 1]);
        Language::query()->updateOrCreate(['code' => 'ps'], ['name' => 'Pashto', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 2]);
        Language::query()->updateOrCreate(['code' => 'fa_AF'], ['name' => 'Dari', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 3]);

        Language::query()->where('code', 'en')->firstOrFail()->makeDefault();

        Language::flushCache();
    }

    public function test_every_seeded_event_carries_all_active_languages(): void
    {
        $this->seed(EventSeeder::class);

        $this->assertGreaterThan(0, Event::query()->count());

        foreach (Event::query()->with('translations.language')->get() as $event) {
            $this->assertHasAllLanguages($event, 'title');
        }
    }

    public function test_every_seeded_job_carries_all_active_languages(): void
    {
        $this->seed(JobSeeder::class);

        $this->assertGreaterThan(0, Job::query()->count());

        foreach (Job::query()->with('translations.language')->get() as $job) {
            $this->assertHasAllLanguages($job, 'title');
        }
    }

    public function test_factory_created_books_carry_all_active_languages(): void
    {
        // Books are produced by the factory (BookLibrarySeeder delegates to it),
        // so exercising a factory-created book covers the translated-table fix.
        $book = Book::factory()->create();

        $this->assertHasAllLanguages($book->fresh(['translations.language']), 'title');
    }

    public function test_seeded_home_blocks_carry_all_active_languages(): void
    {
        $this->seed(HomePageBuilderSeeder::class);

        // Blocks whose copy is authored text (one row per language) and blocks
        // whose copy is a localized list; the live rails hold no text of their
        // own, so they are not part of the sweep.
        $textTypes = ['hero', 'banner', 'announcement', 'articles', 'events', 'recognition'];
        $listTypes = ['features', 'stats'];

        $sections = $this->seededHomeSections();
        $this->assertNotEmpty($sections);

        foreach ($sections as $section) {
            $type = $section->section_type->value;

            if (in_array($type, $textTypes, true)) {
                $this->assertRowsCover(self::CODES, $section->translations->pluck('language.code')->all(), "block {$type}");
            }

            if (in_array($type, $listTypes, true)) {
                $this->assertRowsCover(self::CODES, $section->listItems->pluck('language.code')->all(), "block {$type}");
            }
        }
    }

    public function test_seeded_about_hero_and_story_carry_all_active_languages(): void
    {
        $this->seed(AboutPageBuilderSeeder::class);

        $sections = PageSection::query()
            ->where('page_id', Page::query()->where('key', 'about')->value('id'))
            ->with(['translations.language'])
            ->ordered()
            ->get();

        // The structured rails (stats, values, FAQ …) ship in the default
        // language only and are localized by an admin; the hero title and the
        // story body are the glossary-covered copy and must exist for all three.
        $this->assertRowsCover(self::CODES, $sections[0]->translations->pluck('language.code')->all(), 'about hero');
        $this->assertRowsCover(self::CODES, $sections[1]->translations->pluck('language.code')->all(), 'about story');
    }

    /**
     * Every active language must have at least one non-empty localized row.
     *
     * @param  list<string>  $expected
     * @param  list<string|null>  $actual
     */
    private function assertRowsCover(array $expected, array $actual, string $label): void
    {
        $codes = collect($actual)->filter()->unique()->values()->all();

        foreach ($expected as $code) {
            $this->assertTrue(
                in_array($code, $codes, true),
                'Expected a ['.$code.'] localized row for '.$label.', got: ['.implode(', ', $codes).'].'
            );
        }
    }

    /** @return \Illuminate\Support\Collection<int, PageSection> */
    private function seededHomeSections(): \Illuminate\Support\Collection
    {
        return PageSection::query()
            ->where('page_id', Page::query()->where('key', 'home')->value('id'))
            ->with(['translations.language', 'listItems.language'])
            ->ordered()
            ->get();
    }

    /**
     * Assert the model has a translation row for every active code, and that at
     * least one of the given localized fields is non-empty for each row.
     *
     * @param  string|list<string>  $fields
     */
    private function assertHasAllLanguages(SitePage|Event|Job|Book $model, string|array $fields, bool $anyOf = false): void
    {
        $fields = (array) $fields;
        $label = get_class($model).' #'.$model->id;
        $byCode = $model->translations->keyBy(fn ($row) => $row->language?->code);

        foreach (self::CODES as $code) {
            $this->assertTrue(
                $byCode->has($code) && $byCode[$code] !== null,
                "Expected a [{$code}] translation row for {$label}."
            );

            $filled = array_filter(
                $fields,
                fn (string $field): bool => filled($byCode[$code]->getAttributes()[$field] ?? null),
            );

            if ($anyOf) {
                $this->assertNotEmpty(
                    $filled,
                    'Expected at least one of ['.implode(', ', $fields)."] populated for [{$code}] on {$label}."
                );

                continue;
            }

            foreach ($fields as $field) {
                $this->assertTrue(
                    filled($byCode[$code]->getAttributes()[$field] ?? null),
                    "Expected [{$field}] populated for [{$code}] on {$label}."
                );
            }
        }
    }
}
