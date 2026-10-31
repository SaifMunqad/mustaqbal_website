<?php

namespace Tests\Feature;

use App\Enums\SectionType;
use App\Enums\UserRole;
use App\Models\Article;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\SectionListItem;
use App\Models\User;
use App\Support\Home\BlockRegistry;
use App\Support\Home\PageLayoutWriter;
use App\Support\Home\PageSections;
use Database\Seeders\HomePageBuilderSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_registry_allows_unlimited_instances_of_every_type(): void
    {
        $this->assertTrue(BlockRegistry::canAddMore(SectionType::Articles, 5));
        // Hero is no longer capped: admins can place it as often as they need.
        $this->assertTrue(BlockRegistry::canAddMore(SectionType::Hero, 3));

        $palette = collect(BlockRegistry::palette([SectionType::Hero->value => 3]))
            ->firstWhere('value', 'hero');

        $this->assertTrue($palette['addable']);
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

    public function test_writer_allows_the_same_section_multiple_times(): void
    {
        PageLayoutWriter::save('home', [
            ['section_type' => 'hero', 'is_active' => true],
            ['section_type' => 'articles', 'is_active' => true],
            ['section_type' => 'articles', 'is_active' => true],
        ]);

        $this->assertSame(1, PageSection::where('section_type', 'hero')->count());
        $this->assertSame(2, PageSection::where('section_type', 'articles')->count());
    }

    public function test_seeded_home_layout_populates_the_builder_idempotently(): void
    {
        $this->seed(HomePageBuilderSeeder::class);

        $types = PageSection::ordered()->pluck('section_type')->map(fn ($t) => $t->value)->all();

        // The seeded page opens with the full composition an admin would build by
        // hand: hero, the localized rails, the authored bands and curated rails.
        $this->assertSame('hero', $types[0]);
        $this->assertContains('features', $types);
        $this->assertContains('stats', $types);
        $this->assertContains('banner', $types);
        $this->assertContains('announcement', $types);
        $this->assertContains('programs', $types);
        $this->assertContains('jobs', $types);

        // Hero copy is authored on the block's own translation rows, not on the
        // Site Settings columns.
        $this->assertDatabaseHas('page_section_translations', [
            'heading' => 'Welcome to My School',
            'language_id' => $this->en->id,
        ]);
        $this->assertDatabaseHas('section_list_items', ['item_group' => 'features', 'icon' => 'faculty']);

        // Idempotent: reseeding never duplicates or clobbers the curated layout.
        $count = PageSection::count();
        $this->seed(HomePageBuilderSeeder::class);
        $this->assertSame($count, PageSection::count());
    }

    public function test_new_generic_list_block_round_trips(): void
    {
        PageLayoutWriter::save('home', [
            [
                'id' => null,
                'section_type' => 'testimonials',
                'is_active' => true,
                'span_lg' => 6,
                'translations' => ['en' => ['heading' => 'What families say']],
                'lists' => ['testimonials' => ['en' => [
                    ['title' => 'A Parent', 'value' => 'Mother of two', 'description' => 'Wonderful school.'],
                ]]],
            ],
        ]);

        $this->assertDatabaseHas('page_sections', ['section_type' => 'testimonials', 'span_lg' => 6]);
        $this->assertDatabaseHas('section_list_items', ['item_group' => 'testimonials', 'title' => 'A Parent']);

        $blocks = PageSections::render('home');
        $this->assertSame('list', $blocks[0]['component']);
        $this->assertSame('What families say', $blocks[0]['text']['heading']);
        $this->assertSame('Wonderful school.', $blocks[0]['list'][0]['description']);
    }

    public function test_seeded_home_page_renders_every_band_on_the_public_route(): void
    {
        $this->seed(HomePageBuilderSeeder::class);

        // The seeded layout is the live layout: the public home renders every
        // authored band, with no fallback template left behind. The three card
        // rails (articles / events / recognition) hide themselves because this
        // fixture seeds no such content — the builder's empty-rail rule.
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('welcome')
                ->has('blocks', 7)
                ->where('blocks.0.component', 'hero')
                ->where('blocks.0.hero.title', 'Welcome to My School')
                ->where('blocks.1.component', 'features')
                ->where('blocks.2.component', 'stats')
                ->where('blocks.3.component', 'banner')
                ->where('blocks.4.component', 'announcement')
            );
    }

    public function test_public_home_renders_builder_blocks_when_present(): void
    {
        PageLayoutWriter::save('home', [
            [
                'section_type' => 'announcement',
                'is_active' => true,
                'translations' => ['en' => ['heading' => 'Live notice']],
            ],
        ]);

        // Saved builder content must surface on the public home, not just legacy.
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('welcome')
                ->has('blocks', 1)
                ->where('blocks.0.component', 'announcement')
            );
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
                ->component('dashboard/page-builder/dashboard-page-builder-home')
                ->has('palette', count(SectionType::cases()))
                ->has('categories', 4)
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

    /**
     * Data-loss guard: a partial save (one banner) must never wipe sibling
     * blocks. The endpoint deletes omitted sections only when the caller
     * explicitly asks for whole-layout replacement via remove_missing.
     */
    public function test_builder_save_endpoint_keeps_unmentioned_sections_by_default(): void
    {
        $ids = PageLayoutWriter::save('home', [
            ['id' => null, 'section_type' => 'hero', 'is_active' => true, 'translations' => ['en' => ['heading' => 'Keep me']]],
            ['id' => null, 'section_type' => 'banner', 'is_active' => true],
        ]);

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.pages.home.save'), [
                'sections' => [
                    ['id' => $ids[1], 'section_type' => 'banner', 'is_active' => true, 'tone' => 'red'],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('page_sections', ['id' => $ids[0], 'section_type' => 'hero']);
        $this->assertDatabaseHas('page_section_translations', ['page_section_id' => $ids[0], 'heading' => 'Keep me']);

        // The unmentioned block keeps its slot, behind the submitted ones.
        $ordered = PageSection::query()->where('page_id', Page::resolve('home')->id)->ordered()->pluck('id')->all();
        $this->assertSame([$ids[1], $ids[0]], array_values($ordered));
    }

    public function test_builder_save_endpoint_deletes_only_with_explicit_remove_missing(): void
    {
        $ids = PageLayoutWriter::save('home', [
            ['id' => null, 'section_type' => 'hero', 'is_active' => true],
            ['id' => null, 'section_type' => 'banner', 'is_active' => true],
        ]);

        // This is what the whole-layout web editor sends: its staged save is
        // an intentional replace, so dropped blocks really disappear.
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.pages.home.save'), [
                'sections' => [
                    ['id' => $ids[1], 'section_type' => 'banner', 'is_active' => true],
                ],
                'remove_missing' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseMissing('page_sections', ['id' => $ids[0]]);
        $this->assertDatabaseHas('page_sections', ['id' => $ids[1]]);
    }

    public function test_builder_save_endpoint_rejects_unknown_translation_language_codes(): void
    {
        // Guard against silent data loss: the writer skips codes outside the
        // active set, so "fa" (instead of the seeded Dari code) must be a
        // visible validation failure, never a saved-without-text success.
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.pages.home.save'), [
                'sections' => [
                    ['id' => null, 'section_type' => 'hero', 'is_active' => true, 'translations' => ['fa' => ['heading' => 'Wrong code']]],
                ],
            ])
            ->assertSessionHasErrors('sections.0.translations');

        $this->assertDatabaseCount('page_sections', 0);
    }

    public function test_builder_save_endpoint_persists_row_images_and_links(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.pages.home.save'), [
                'sections' => [
                    [
                        'id' => null,
                        'section_type' => 'gallery',
                        'is_active' => true,
                        'translations' => ['en' => ['heading' => 'Campus']],
                        'lists' => [
                            'gallery' => [
                                'en' => [
                                    [
                                        'title' => 'Front gate',
                                        'image_path' => '/storage/uploads/gate.jpg',
                                        'url' => '/about',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('section_list_items', [
            'item_group' => 'gallery',
            'title' => 'Front gate',
            'image_path' => '/storage/uploads/gate.jpg',
            'url' => '/about',
        ]);
    }

    public function test_authored_banner_with_only_an_image_still_renders(): void
    {
        $page = $this->page();
        $banner = $this->section($page, SectionType::Banner, 0);
        $banner->update(['image_path' => '/storage/uploads/promo.jpg']);

        $blocks = PageSections::render('home');

        // An image-only banner is a valid authored block: it must not vanish
        // from the live page just because the text has not been written yet.
        $this->assertCount(1, $blocks);
        $this->assertSame('banner', $blocks[0]['variant']);
        $this->assertSame('/storage/uploads/promo.jpg', $blocks[0]['config']['image_url']);
    }

    public function test_authored_blocks_with_only_a_button_still_render(): void
    {
        $page = $this->page();

        $banner = $this->section($page, SectionType::Banner, 0);
        $banner->update(['cta_url' => '/school/programs']);
        $banner->translations()->create(['language_id' => $this->en->id, 'cta_label' => 'See programs']);

        $announcement = $this->section($page, SectionType::Announcement, 1);
        $announcement->update(['cta_url' => '/school/contact']);
        $announcement->translations()->create(['language_id' => $this->en->id, 'cta_label' => 'Contact us']);

        $blocks = PageSections::render('home');

        // A button-only banner/announcement is still real content: the author
        // may add the heading later, so it must not be dropped in the meantime.
        $this->assertCount(2, $blocks);
        $this->assertSame('See programs', $blocks[0]['config']['cta_label']);
        $this->assertSame('/school/programs', $blocks[0]['config']['cta_url']);
        $this->assertSame('announcement', $blocks[1]['variant']);
        $this->assertSame('/school/contact', $blocks[1]['config']['cta_url']);
    }

    public function test_authored_block_with_a_bare_link_stays_hidden(): void
    {
        $page = $this->page();
        $announcement = $this->section($page, SectionType::Announcement, 0);

        // A URL with no label paints nothing, so the block is still dropped
        // rather than emitting an empty card.
        $announcement->update(['cta_url' => '/nowhere']);

        $this->assertCount(0, PageSections::render('home'));
    }

    public function test_grid_blocks_expose_columns_and_authored_heading(): void
    {
        $page = $this->page();

        $features = $this->section($page, SectionType::Features, 0);
        $features->update(['columns' => 2]);
        $features->translations()->create([
            'language_id' => $this->en->id,
            'heading' => 'Why families stay',
            'body' => 'Small classes, steady teachers.',
        ]);
        SectionListItem::create([
            'page_section_id' => $features->id,
            'language_id' => $this->en->id,
            'item_group' => 'features',
            'sort_order' => 0,
            'title' => 'Small classes',
            'icon' => 'classes',
        ]);

        $blocks = PageSections::render('home');

        // The editor's Columns field and heading/body inputs are real controls:
        // they reach the renderer instead of being silently dropped.
        $this->assertSame(2, $blocks[0]['columns']);
        $this->assertSame('Why families stay', $blocks[0]['text']['heading']);
        $this->assertSame('Small classes, steady teachers.', $blocks[0]['text']['body']);
    }

    public function test_builder_save_persists_columns(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.pages.home.save'), [
                'sections' => [
                    [
                        'id' => null,
                        'section_type' => 'gallery',
                        'is_active' => true,
                        'columns' => 2,
                        'translations' => ['en' => ['heading' => 'Campus photos']],
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('page_sections', [
            'section_type' => 'gallery',
            'columns' => 2,
        ]);
    }

    public function test_curated_block_without_a_title_exposes_no_translation_key(): void
    {
        $page = $this->page();

        $article = Article::create([
            'user_id' => User::factory()->create()->id,
            'title' => 'Untitled rail article',
            'slug' => 'untitled-rail-article',
            'body' => 'Body text.',
            'is_published' => true,
            'published_at' => now()->subDay(),
        ]);

        $section = $this->section($page, SectionType::Articles, 0);
        $section->items()->create(['item_type' => 'article', 'item_id' => $article->id, 'sort_order' => 0]);

        $blocks = PageSections::render('home');

        // Authored copy is data, never an i18n key: an un-authored heading is
        // simply blank, so the renderer never prints something like
        // "enums.sectionType.articles" into the page.
        $this->assertSame('', $blocks[0]['title']);
        $this->assertArrayNotHasKey('title_key', $blocks[0]);
    }
}
