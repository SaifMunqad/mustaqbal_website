<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Event;
use App\Models\HomeSection;
use App\Models\Job;
use App\Models\Language;
use App\Models\SitePage;
use Database\Seeders\AboutPageSeeder;
use Database\Seeders\EventSeeder;
use Database\Seeders\HomeSectionSeeder;
use Database\Seeders\JobSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards the seeder/factory fix that populates every localized table for ALL
 * active languages, not just the default. Each translated entity must end up
 * with an English (default) row plus a Pashto and a Dari row carrying real,
 * in-language content — so no secondary language silently falls back to English
 * on the public site after a fresh seed.
 */
class SeededTranslationCoverageTest extends TestCase
{
    use RefreshDatabase;

    private const CODES = ['en', 'ps', 'fa_AF'];

    protected function setUp(): void
    {
        parent::setUp();

        Language::query()->create(['code' => 'en', 'name' => 'English', 'dir' => 'ltr', 'is_active' => true, 'is_default' => true, 'sort_order' => 1]);
        Language::query()->create(['code' => 'ps', 'name' => 'Pashto', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 2]);
        Language::query()->create(['code' => 'fa_AF', 'name' => 'Dari', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 3]);

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

    public function test_seeded_home_sections_carry_all_active_languages(): void
    {
        $this->seed(HomeSectionSeeder::class);

        $this->assertGreaterThan(0, HomeSection::query()->count());

        foreach (HomeSection::query()->with('translations.language')->get() as $section) {
            $this->assertHasAllLanguages($section, ['title', 'heading'], anyOf: true);
        }
    }

    public function test_the_about_page_carries_all_active_languages(): void
    {
        $this->seed(AboutPageSeeder::class);

        $page = SitePage::query()->where('slug', 'about')->firstOrFail();

        $this->assertHasAllLanguages($page->fresh(['translations.language']), 'title');
    }

    /**
     * Assert the model has a translation row for every active code, and that at
     * least one of the given localized fields is non-empty for each row.
     *
     * @param  string|list<string>  $fields
     */
    private function assertHasAllLanguages(SitePage|Event|Job|Book|HomeSection $model, string|array $fields, bool $anyOf = false): void
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
