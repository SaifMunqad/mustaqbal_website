<?php

namespace Tests\Feature;

use App\Models\Language;
use App\Models\Page;
use App\Support\Home\PageLayoutWriter;
use App\Support\Home\PageSections;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Regression guard for builder render caching with the database store (the
 * production default in `.env`).
 *
 * `Cache::increment()` returns false without creating a missing key on the
 * database store, so the old flush silently failed on the first save and the
 * public page kept serving the layout cached before the edit — most visibly on
 * About, where an empty cached layout meant the legacy page stayed visible.
 */
class PageRenderCacheTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        Language::query()->delete();
        Language::flushCache();

        Language::query()->create([
            'code' => 'en',
            'name' => 'EN',
            'dir' => 'ltr',
            'is_active' => true,
            'is_default' => true,
            'sort_order' => 0,
        ]);

        app()->setLocale('en');

        // Exercise the same store as the local/production .env (database).
        config(['cache.default' => 'database']);
        Cache::store('database')->flush();
    }

    public function test_saving_invalidates_a_cached_layout(): void
    {
        Page::resolve('about');

        PageLayoutWriter::save('about', [$this->hero('Old heading')]);
        $this->assertSame('Old heading', PageSections::render('about')[0]['hero']['title']);

        PageLayoutWriter::save('about', [$this->hero('New heading')]);

        // The cache must never outlive a save, even on the first flush when the
        // version key does not exist yet.
        $this->assertSame('New heading', PageSections::render('about')[0]['hero']['title']);
    }

    public function test_an_empty_cached_layout_is_ignored_after_the_first_save(): void
    {
        Page::resolve('about');

        // The visitor opens About before any block exists: this must not pin the
        // empty layout in the cache.
        $this->assertSame([], PageSections::render('about'));

        PageLayoutWriter::save('about', [$this->hero('Fresh heading')]);

        $this->assertSame('Fresh heading', PageSections::render('about')[0]['hero']['title']);
    }

    public function test_flush_creates_the_version_key_on_first_use(): void
    {
        PageSections::flush('about');

        $this->assertSame(1, (int) Cache::get('pagebuilder.version.about'));

        PageSections::flush('about');

        $this->assertSame(2, (int) Cache::get('pagebuilder.version.about'));
    }

    /**
     * @return array<string, mixed>
     */
    private function hero(string $heading): array
    {
        return [
            'id' => null,
            'section_type' => 'hero',
            'is_active' => true,
            'translations' => ['en' => ['heading' => $heading]],
        ];
    }
}
