<?php

namespace Tests\Feature;

use App\Enums\SectionType;
use App\Enums\UserRole;
use App\Models\Article;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\SectionListItem;
use App\Support\Home\BlockRegistry;
use App\Support\Home\PageSections;
use App\Support\Home\PageLayoutWriter;
use App\Support\Home\PageBuilderBackfill;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Checkpoint for the normalized page builder: the new schema migrates, models +
 * relations hydrate, and PageSections::render assembles a categorized,
 * responsive, live-referenced layout (hero / curated / localized lists).
 */
class PageBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected Language $en;

    protected function setUp(): void
    {
        parent::setUp();

        // Editor routes render the Inertia root view; stub Vite so tests never
        // depend on a compiled manifest for the new page chunk.
        $this->withoutVite();

        Language::query()->delete();
        Language::flushCache();

        $this->en = $this->language('en', true);
        $this->language('ps', false);

        app()->setLocale('en');
    }

    private function language(string $code, bool $default): Language
    {
        return Language::create([
            'code' => $code,
            'name' => strtoupper($code),
            'dir' => $code === 'ar' ? 'rtl' : 'ltr',
            'is_active' => true,
            'is_default' => $default,
            'sort_order' => $default ? 0 : 1,
        ]);
    }

    private function page(): Page
    {
        return Page::resolve('home');
    }

    private function section(Page $page, SectionType $type, int $order = 0): PageSection
    {
        return PageSection::create([
            'page_id' => $page->id,
            'section_type' => $type->value,
            'zone' => 'main',
            'sort_order' => $order,
            'is_active' => true,
            'config' => [],
        ]);
    }

    public function test_new_schema_migrates_and_resolves_a_page(): void
    {
        $page = $this->page();

        $this->assertSame('home', $page->key);
        // resolve() is idempotent.
        $this->assertSame($page->id, Page::resolve('home')->id);
    }

    public function test_curated_block_resolves_live_reference_and_default_spans(): void
    {
        $page = $this->page();

        $article = Article::create([
            'user_id' => User::factory()->create()->id,
            'title' => 'Reading matters',
            'slug' => 'reading-matters',
            'body' => 'A short article body.',
            'excerpt' => 'Why reading matters.',
            'is_published' => true,
            'published_at' => now()->subDay(),
        ]);

        $section = $this->section($page, SectionType::Articles, 0);
        $section->items()->create(['item_type' => 'article', 'item_id' => $article->id, 'sort_order' => 0]);
        $section->translations()->create(['language_id' => $this->en->id, 'title' => 'Latest articles']);

        $blocks = PageSections::render('home');

        $this->assertCount(1, $blocks);
        $this->assertSame('cards', $blocks[0]['component']);
        $this->assertSame('Latest articles', $blocks[0]['title']);
        $this->assertSame(12, $blocks[0]['spans']['lg']);
        $this->assertCount(1, $blocks[0]['items']);
        $this->assertSame('Reading matters', $blocks[0]['items'][0]['title']);
    }

    public function test_feature_list_resolves_through_language_fallback(): void
    {
        $page = $this->page();
        $ps = Language::where('code', 'ps')->first();

        $section = $this->section($page, SectionType::Features, 0);

        // English rows exist; Pashto rows do not → Pashto viewers fall back to English.
        SectionListItem::create([
            'page_section_id' => $section->id,
            'language_id' => $this->en->id,
            'item_group' => 'features',
            'sort_order' => 0,
            'title' => 'Safe space',
            'description' => 'A caring environment.',
            'icon' => 'shield',
        ]);

        $blocks = PageSections::render('home');

        $this->assertSame('features', $blocks[0]['component']);
        $this->assertSame('Safe space', $blocks[0]['features'][0]['title']);
        $this->assertSame('shield', $blocks[0]['features'][0]['icon']);

        // A stray Pashto row must not shadow English for the current locale.
        SectionListItem::create([
            'page_section_id' => $section->id,
            'language_id' => $ps->id,
            'item_group' => 'features',
            'sort_order' => 0,
            'title' => 'خونه',
        ]);

        $this->assertSame('Safe space', PageSections::render('home')[0]['features'][0]['title']);
    }

    public function test_registry_enforces_singleton_but_not_unlimited_types(): void
    {
        $this->assertTrue(BlockRegistry::canAddMore(SectionType::Articles, 5));
        $this->assertTrue(BlockRegistry::canAddMore(SectionType::Hero, 0));
        $this->assertFalse(BlockRegistry::canAddMore(SectionType::Hero, 1));

        $palette = collect(BlockRegistry::palette([SectionType::Hero->value => 1]))
            ->firstWhere('value', 'hero');

        $this->assertFalse($palette['addable']);
    }

    public function test_empty_curated_block_is_hidden(): void
    {
        $page = $this->page();
        $this->section($page, SectionType::Events, 0);

        // No events exist → the rail is dropped rather than rendered empty.
        $this->assertCount(0, PageSections::render('home'));
    }

    public function test_writer_persists_categorized_layout_and_round_trips(): void
    {
        $article = Article::create([
            'user_id' => User::factory()->create()->id,
            'title' => 'Referenced post',
            'slug' => 'referenced-post',
            'body' => 'Body text.',
            'is_published' => true,
            'published_at' => now()->subDay(),
        ]);

        PageLayoutWriter::save('home', [
            [
                'section_type' => 'hero',
                'is_active' => true,
                'image_path' => '/uploads/hero.jpg',
                'config' => ['tagline' => 'Learning together'],
                'translations' => ['en' => ['heading' => 'Welcome', 'body' => 'Subtitle', 'cta_label' => 'Enroll']],
            ],
            [
                'section_type' => 'articles',
                'is_active' => true,
                'items' => [['id' => $article->id]],
                'translations' => ['en' => ['title' => 'From the blog']],
            ],
            [
                'section_type' => 'features',
                'is_active' => true,
                'lists' => ['features' => ['en' => [
                    ['title' => 'Safe', 'description' => 'Caring', 'icon' => 'shield'],
                ]]],
            ],
        ]);

        // Categorized storage: columns, translation rows, item refs, list rows.
        $this->assertDatabaseHas('page_sections', ['section_type' => 'hero', 'image_path' => '/uploads/hero.jpg']);
        $this->assertDatabaseHas('page_section_translations', ['heading' => 'Welcome']);
        $this->assertDatabaseHas('section_items', ['item_type' => 'article', 'item_id' => $article->id]);
        $this->assertDatabaseHas('section_list_items', ['item_group' => 'features', 'title' => 'Safe', 'icon' => 'shield']);

        // Order is preserved and every block round-trips through render().
        $blocks = PageSections::render('home');
        $this->assertSame(['hero', 'cards', 'features'], array_column($blocks, 'component'));
        $this->assertSame('From the blog', $blocks[1]['title']);
        $this->assertSame('Referenced post', $blocks[1]['items'][0]['title']);
        $this->assertSame('Safe', $blocks[2]['features'][0]['title']);
    }

    public function test_writer_rejects_a_second_singleton_hero(): void
    {
        $this->expectException(ValidationException::class);

        PageLayoutWriter::save('home', [
            ['section_type' => 'hero', 'is_active' => true],
            ['section_type' => 'hero', 'is_active' => true],
        ]);
    }

    public function test_backfill_migrates_legacy_and_site_content_idempotently(): void
    {
        $site = SiteSetting::resolved();
        $site->update([
            'home_title' => 'Welcome',
            'home_subtitle' => 'Subtitle',
            'home_features' => [['icon' => 'shield', 'title' => 'Safe', 'description' => 'Desc']],
        ]);

        // A legacy curated section with authored text.
        DB::table('home_sections')->insertGetId([
            'section_type' => 'articles',
            'config' => json_encode(['item_ids' => [], 'tone' => 'blue']),
            'limit' => 3,
            'sort_order' => 0,
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        PageBuilderBackfill::run();

        $types = PageSection::ordered()->pluck('section_type')->map(fn ($t) => $t->value)->all();
        $this->assertContains('hero', $types);
        $this->assertContains('features', $types);
        $this->assertContains('articles', $types);

        // Hero copy carried over as a localized translation row.
        $this->assertDatabaseHas('page_section_translations', ['heading' => 'Welcome', 'body' => 'Subtitle']);

        // Features list rows carried over from SiteSettings JSON.
        $this->assertDatabaseHas('section_list_items', ['item_group' => 'features', 'title' => 'Safe', 'icon' => 'shield']);

        // Idempotent: re-running adds nothing.
        $count = PageSection::count();
        PageBuilderBackfill::run();
        $this->assertSame($count, PageSection::count());
    }

    public function test_builder_visual_feed_exposes_palette_and_drafts(): void
    {
        $page = $this->page();
        $hero = $this->section($page, SectionType::Hero, 0);
        $hero->translations()->create(['language_id' => $this->en->id, 'heading' => 'Hi']);

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->get(route('dashboard.pages.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('dashboard/pages/home')
                ->has('palette')
                ->where('defaultLanguage', 'en')
                ->where('sections.0.section_type', 'hero')
                ->where('sections.0.translations.en.heading', 'Hi')
                ->where('sections.0.translations.ps.heading', '')
            );
    }

    public function test_builder_save_endpoint_persists_layout(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.pages.home.save'), [
                'sections' => [
                    [
                        'id' => null,
                        'section_type' => 'banner',
                        'is_active' => true,
                        'span_lg' => 6,
                        'tone' => 'blue',
                        'translations' => ['en' => ['heading' => 'Saved banner']],
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('page_sections', ['section_type' => 'banner', 'span_lg' => 6]);
        $this->assertDatabaseHas('page_section_translations', ['heading' => 'Saved banner']);
    }
}
