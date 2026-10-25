<?php

namespace Tests\Feature;

use App\Enums\SectionType;
use App\Enums\UserRole;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\SitePage;
use App\Models\User;
use App\Support\Home\BlockRegistry;
use Database\Seeders\AboutPageBuilderSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Covers the About page on the normalized page builder: the seeder authors the
 * layout straight into blocks, the palette is shared across every builder page,
 * rich text is sanitized on save, and the public page renders the saved layout.
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

    public function test_seeded_about_layout_authors_every_block_and_is_idempotent(): void
    {
        $this->seed(AboutPageBuilderSeeder::class);

        $page = Page::query()->where('key', 'about')->firstOrFail();
        $sections = PageSection::query()
            ->where('page_id', $page->id)
            ->with(['translations.language', 'listItems.language'])
            ->ordered()
            ->get();

        $this->assertSame([
            'hero',
            'rich_text',
            'rich_text',
            'rich_text',
            'stats',
            'icon_cards',
            'testimonials',
            'team',
            'testimonials',
            'testimonials',
            'faqs',
        ], $sections->map(fn (PageSection $s): string => $s->section_type->value)->all());

        $hero = $sections[0];
        $this->assertSame('/school/enroll', $hero->cta_url);
        $this->assertSame('/school/contact', $hero->config['cta_secondary_url']);
        $this->assertStringStartsWith('https://images.unsplash.com/', (string) $hero->image_path);
        $this->assertSame('About My School', $hero->translations->firstWhere('language.code', 'en')->heading);
        $this->assertStringStartsWith('My School is a community learning centre', (string) $hero->translations->firstWhere('language.code', 'en')->body);
        $this->assertSame('د زما ښوونځي په اړه', $hero->translations->firstWhere('language.code', 'ps')->heading);

        // The story keeps its rich HTML per language.
        $story = $sections[1];
        $this->assertStringContainsString('founded on a simple belief', (string) $story->translations->firstWhere('language.code', 'en')->body);
        $this->assertStringContainsString('<p>', (string) $story->translations->firstWhere('language.code', 'ps')->body);

        // Mission and vision are their own authored blocks.
        $this->assertSame('Mission', $sections[2]->translations->firstWhere('language.code', 'en')->heading);
        $this->assertSame('Vision', $sections[3]->translations->firstWhere('language.code', 'en')->heading);

        // Stats carry value + label on the shared stats list.
        $stat = $sections[4]->listItems->firstWhere('language.code', 'en');
        $this->assertSame('1,200+', $stat->value);
        $this->assertSame('Students taught', $stat->title);

        // Values keep their icon keys.
        $value = $sections[5]->listItems->firstWhere('language.code', 'en');
        $this->assertSame('Knowledge first', $value->title);
        $this->assertSame('book-open', $value->icon);

        // The leadership message keeps author name, role and image.
        $message = $sections[7]->listItems->firstWhere('language.code', 'en');
        $this->assertSame('School Administration', $message->title);
        $this->assertSame('Principal & Management Team', $message->value);
        $this->assertStringStartsWith('https://images.unsplash.com/', (string) $message->image_path);

        // Idempotent: reseeding never duplicates or clobbers.
        $count = PageSection::query()->count();
        $this->seed(AboutPageBuilderSeeder::class);
        $this->assertSame($count, PageSection::query()->count());
    }

    public function test_about_builder_offers_the_shared_catalog(): void
    {
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
            ->put(route('dashboard.pages.about.save'), [
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
            ->put(route('dashboard.pages.about.save'), [
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

    public function test_public_about_renders_the_seeded_builder_layout(): void
    {
        $this->seed(AboutPageBuilderSeeder::class);
        $this->publishedAboutPage();

        $this->get(route('school.about'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('school/about/school-about')
                ->has('blocks', 11)
                ->where('blocks.0.component', 'hero')
                ->where('blocks.0.hero.title', 'About My School')
            );
    }

    public function test_public_about_renders_nothing_but_the_title_when_no_layout_is_authored(): void
    {
        $this->publishedAboutPage();

        // No blocks yet: the page still resolves, and the published title is what
        // the document head falls back to until an admin composes a layout.
        $this->get(route('school.about'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('school/about/school-about')
                ->where('blocks', [])
                ->where('title', 'About My School')
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
     * The publishing row the public screen reads for its SEO title fallback.
     */
    private function publishedAboutPage(): SitePage
    {
        $page = SitePage::query()->create([
            'slug' => 'about',
            'is_published' => true,
        ]);

        $page->syncDefaultTranslation(['title' => 'About My School']);

        return $page;
    }
}
