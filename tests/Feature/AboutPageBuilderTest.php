<?php

namespace Tests\Feature;

use App\Enums\SectionType;
use App\Enums\UserRole;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\SitePage;
use App\Models\User;
use App\Support\Home\AboutPageBackfill;
use App\Support\Home\BlockRegistry;
use Database\Seeders\AboutPageBuilderSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Covers the About page on the normalized page builder: the palette is scoped,
 * the legacy site_pages content is backfilled into blocks once, rich text is
 * sanitized, and the public About page renders the saved layout.
 */
class AboutPageBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected Language $en;

    protected Language $ps;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        Language::query()->delete();
        Language::flushCache();

        $this->en = $this->language('en', true);
        $this->ps = $this->language('ps', false);

        app()->setLocale('en');
    }

    public function test_about_backfill_maps_every_legacy_block_and_is_idempotent(): void
    {
        $this->legacyAboutPage();

        AboutPageBackfill::run();

        $page = Page::query()->where('key', 'about')->firstOrFail();
        $sections = PageSection::query()
            ->where('page_id', $page->id)
            ->with(['translations.language', 'listItems.language'])
            ->ordered()
            ->get();

        $this->assertSame([
            'hero',
            'rich_text',
            'stats',
            'icon_cards',
            'testimonials',
            'team',
            'testimonials',
            'testimonials',
            'faqs',
            'video_embed',
        ], $sections->map(fn (PageSection $s): string => $s->section_type->value)->all());

        $hero = $sections[0];
        $this->assertSame('/storage/hero.jpg', $hero->image_path);
        $this->assertSame('/school/enroll', $hero->cta_url);
        $this->assertSame('/school/contact', $hero->config['cta_secondary_url']);
        $this->assertSame('About us', $hero->translations->firstWhere('language.code', 'en')->heading);
        $this->assertSame('EN intro', $hero->translations->firstWhere('language.code', 'en')->body);
        $this->assertSame('زموږ په اړه', $hero->translations->firstWhere('language.code', 'ps')->heading);

        // The story keeps its rich HTML per language.
        $story = $sections[1];
        $this->assertStringContainsString('<p>EN story</p>', $story->translations->firstWhere('language.code', 'en')->body);
        $this->assertStringContainsString('<p>PS story</p>', $story->translations->firstWhere('language.code', 'ps')->body);

        // Stats map value/label onto the shared stats list.
        $stat = $sections[2]->listItems->firstWhere('language.code', 'en');
        $this->assertSame('100+', $stat->value);
        $this->assertSame('Students', $stat->title);

        // Values keep their icon keys.
        $value = $sections[3]->listItems->firstWhere('language.code', 'en');
        $this->assertSame('Knowledge', $value->title);
        $this->assertSame('book-open', $value->icon);

        // The leadership message keeps author name, role and image.
        $message = $sections[5]->listItems->firstWhere('language.code', 'en');
        $this->assertSame('Principal', $message->title);
        $this->assertSame('Lead', $message->value);
        $this->assertSame('Welcome', $message->description);
        $this->assertSame('/storage/p.jpg', $message->image_path);

        // The video embed is lifted out of the pasted iframe.
        $this->assertSame(
            'https://www.youtube.com/embed/abc',
            $sections[9]->config['video_url'],
        );

        // Idempotent: re-running never duplicates or clobbers.
        $count = PageSection::query()->count();
        AboutPageBackfill::run();
        $this->assertSame($count, PageSection::query()->count());
    }

    public function test_about_builder_seeder_mirrors_the_legacy_page_idempotently(): void
    {
        $this->legacyAboutPage();

        $this->seed(AboutPageBuilderSeeder::class);

        $page = Page::query()->where('key', 'about')->firstOrFail();
        $this->assertSame(10, PageSection::query()->where('page_id', $page->id)->count());

        // Seeding again must not duplicate or clobber the layout.
        $this->seed(AboutPageBuilderSeeder::class);
        $this->assertSame(10, PageSection::query()->where('page_id', $page->id)->count());
    }

    public function test_about_builder_offers_the_shared_catalog(): void
    {
        $this->legacyAboutPage();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->get(route('dashboard.pages.about'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('dashboard/page-builder/dashboard-page-builder-about')
                ->where('page.key', 'about')
                // Every builder page offers the same catalog: no editorial subset.
                ->has('palette', count(SectionType::cases()))
                ->where('palette.0.value', 'hero')
                ->where('palette.1.value', 'split_hero')
            );

        // Live rails that used to be home-only are available on every page.
        $this->assertTrue(BlockRegistry::canUse('about', SectionType::RichText));
        $this->assertTrue(BlockRegistry::canUse('about', SectionType::Jobs));
        $this->assertTrue(BlockRegistry::canUse('contact', SectionType::Articles));
        // Unknown page keys still cannot be edited through the builder.
        $this->assertFalse(BlockRegistry::canUse('pricing', SectionType::Hero));
    }

    public function test_builder_save_persists_the_about_layout(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.about.visual.save'), [
                'sections' => [
                    [
                        'id' => null,
                        'section_type' => 'hero',
                        'is_active' => true,
                        'image_path' => '/storage/about-hero.jpg',
                        'cta_url' => '/school/enroll',
                        'translations' => ['en' => ['heading' => 'Welcome', 'body' => 'Intro']],
                    ],
                    [
                        'id' => null,
                        'section_type' => 'rich_text',
                        'is_active' => true,
                        'translations' => ['en' => ['body' => '<p>Our story</p><script>alert(1)</script>']],
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('page_sections', ['section_type' => 'hero', 'image_path' => '/storage/about-hero.jpg']);
        $this->assertDatabaseHas('page_sections', ['section_type' => 'rich_text']);

        // Rich text is sanitized before it is ever rendered as HTML.
        $body = PageSection::query()
            ->where('section_type', 'rich_text')
            ->firstOrFail()
            ->translations()
            ->firstOrFail()
            ->body;

        $this->assertStringContainsString('<p>Our story</p>', $body);
        $this->assertStringNotContainsString('<script', $body);
    }

    public function test_a_live_rail_can_be_saved_on_about(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.about.visual.save'), [
                'sections' => [
                    [
                        'id' => null,
                        'section_type' => 'jobs',
                        'is_active' => true,
                        'limit' => 2,
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('page_sections', ['section_type' => 'jobs', 'limit' => 2]);
    }

    public function test_public_about_renders_the_saved_builder_layout(): void
    {
        $this->legacyAboutPage();
        AboutPageBackfill::run();

        $this->get(route('school.about'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('school/about/school-about')
                ->has('blocks', 10)
                ->where('blocks.0.component', 'hero')
                ->where('blocks.0.hero.title', 'About us')
            );
    }

    public function test_public_about_falls_back_to_legacy_content_without_blocks(): void
    {
        $this->legacyAboutPage();

        // No backfill: the builder has no active blocks, so the view keeps the
        // legacy site_pages composition (blocks is an empty list).
        $this->get(route('school.about'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('school/about/school-about')
                ->where('blocks', [])
                ->where('page.slug', 'about')
            );
    }

    private function language(string $code, bool $isDefault): Language
    {
        return Language::query()->create([
            'code' => $code,
            'name' => strtoupper($code),
            'dir' => $code === 'ps' ? 'rtl' : 'ltr',
            'is_active' => true,
            'is_default' => $isDefault,
            'sort_order' => $isDefault ? 0 : 1,
        ]);
    }

    /**
     * Seed a representative legacy About page: default sections on the parent
     * content column, Pashto sections on its translation row.
     */
    private function legacyAboutPage(): SitePage
    {
        $page = SitePage::query()->create([
            'slug' => 'about',
            'hero_image' => '/storage/hero.jpg',
            'is_published' => true,
            'content' => [
                'intro' => 'EN intro',
                'mission' => 'EN mission',
                'stats' => [['value' => '100+', 'label' => 'Students']],
                'values' => [['icon' => 'book-open', 'title' => 'Knowledge', 'text' => 'First']],
                'highlights' => [['title' => 'Teachers', 'text' => 'Caring']],
                'goals' => ['Grow'],
                'main_points' => ['Safe'],
                'message' => [
                    'text' => 'Welcome',
                    'author_name' => 'Principal',
                    'author_role' => 'Lead',
                    'author_image' => '/storage/p.jpg',
                ],
                'faq' => [['question' => 'Q?', 'answer' => 'A.']],
                'video_embed' => '<iframe src="https://www.youtube.com/embed/abc"></iframe>',
            ],
        ]);

        $page->syncDefaultTranslation(['title' => 'About us', 'body' => '<p>EN story</p>']);

        $page->translations()->create([
            'language_id' => $this->ps->id,
            'title' => 'زموږ په اړه',
            'body' => '<p>PS story</p>',
            'content' => [
                'intro' => 'PS intro',
                'stats' => [['value' => '۱۰۰+', 'label' => 'زده کوونکي']],
                'values' => [['icon' => 'book-open', 'title' => 'پوهه', 'text' => 'لومړی']],
                'highlights' => [['title' => 'ښوونکي', 'text' => 'مهربان']],
                'goals' => ['ودې'],
                'main_points' => ['خوندي'],
                'message' => [
                    'text' => 'ښه راغلاست',
                    'author_name' => 'مدیر',
                    'author_role' => 'مشر',
                    'author_image' => '/storage/p.jpg',
                ],
                'faq' => [['question' => 'پوښتنه؟', 'answer' => 'ځواب.']],
            ],
        ]);

        return $page;
    }
}
