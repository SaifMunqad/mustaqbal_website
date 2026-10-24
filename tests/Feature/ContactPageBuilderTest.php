<?php

namespace Tests\Feature;

use App\Enums\SectionType;
use App\Enums\UserRole;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\SitePage;
use App\Models\User;
use App\Support\Home\ContactPageBackfill;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Covers the Contact page on the unified page builder: it is the third builder
 * page, offers the same block catalog as Home and About, saves through the same
 * writer, and only adopts the builder layout once blocks exist (the seeder-only
 * backfill reproduces the legacy design).
 */
class ContactPageBuilderTest extends TestCase
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

    public function test_contact_editor_renders_the_shared_catalog(): void
    {
        $this->contactPage();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->get(route('dashboard.pages.contact'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('dashboard/page-builder/dashboard-page-builder-contact')
                ->where('page.key', 'contact')
                ->where('page.label', 'Contact page')
                ->where('page.label_key', 'dashboard.contactPage.title')
                ->where('page.save_url', route('dashboard.pages.contact.save'))
                // No dedicated settings screen, so the editor has no parent crumb.
                ->where('page.index_url', null)
                ->has('palette', count(SectionType::cases()))
                ->where('palette.0.value', 'hero')
            );

        $this->assertDatabaseHas('pages', ['key' => 'contact']);
    }

    public function test_builder_save_persists_contact_blocks_in_order(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.pages.contact.save'), [
                'sections' => [
                    [
                        'id' => null,
                        'section_type' => 'hero',
                        'is_active' => true,
                        'translations' => ['en' => ['heading' => 'Talk to us']],
                    ],
                    [
                        'id' => null,
                        'section_type' => 'contact_form',
                        'is_active' => true,
                        'span_lg' => 6,
                    ],
                    [
                        'id' => null,
                        'section_type' => 'contact_details',
                        'is_active' => true,
                        'span_lg' => 6,
                    ],
                    [
                        'id' => null,
                        'section_type' => 'map',
                        'is_active' => true,
                    ],
                ],
            ])
            ->assertRedirect();

        $page = Page::query()->where('key', 'contact')->firstOrFail();

        $this->assertSame(
            ['hero', 'contact_form', 'contact_details', 'map'],
            PageSection::query()
                ->where('page_id', $page->id)
                ->ordered()
                ->get()
                ->map(fn (PageSection $section): string => $section->section_type->value)
                ->all(),
        );

        $this->assertDatabaseHas('page_section_translations', ['heading' => 'Talk to us']);
    }

    public function test_public_contact_renders_the_builder_layout(): void
    {
        $this->contactPage();
        ContactPageBackfill::run();

        $this->get(route('school.contact'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('school/contact/school-contact')
                ->has('blocks', 4)
                ->where('blocks.0.component', 'hero')
                ->where('blocks.0.hero.title', 'Contact My School')
                ->where('blocks.1.component', 'contact_form')
                ->where('blocks.2.component', 'contact_details')
                ->where('blocks.3.component', 'map')
            );
    }

    public function test_public_contact_falls_back_to_legacy_content_without_blocks(): void
    {
        $this->contactPage();

        // No backfill and no saved layout: the view keeps the legacy composition.
        $this->get(route('school.contact'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('school/contact/school-contact')
                ->where('blocks', [])
                ->where('page.slug', 'contact')
            );
    }

    public function test_contact_backfill_maps_the_current_design_once(): void
    {
        $this->contactPage();

        ContactPageBackfill::run();

        $page = Page::query()->where('key', 'contact')->firstOrFail();

        $this->assertSame(4, PageSection::query()->where('page_id', $page->id)->count());

        // Form and details sit side by side on desktop, matching the legacy row.
        $this->assertDatabaseHas('page_sections', [
            'section_type' => 'contact_form',
            'span_lg' => 6,
        ]);
        $this->assertDatabaseHas('page_sections', [
            'section_type' => 'contact_details',
            'span_lg' => 6,
        ]);

        $hero = PageSection::query()
            ->where('page_id', $page->id)
            ->where('section_type', SectionType::Hero->value)
            ->firstOrFail();

        $this->assertSame(
            'Contact My School',
            $hero->translations()->where('language_id', $this->en->id)->value('heading'),
        );
        $this->assertSame(
            'زموږ سره اړیکه',
            $hero->translations()->where('language_id', $this->ps->id)->value('heading'),
        );

        // Idempotent: re-running never duplicates the layout.
        $count = PageSection::query()->count();
        ContactPageBackfill::run();
        $this->assertSame($count, PageSection::query()->count());
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
     * The seeded contact page: localized title, no authored body (the legacy
     * view keeps contact details in Site Settings).
     */
    private function contactPage(): SitePage
    {
        $page = SitePage::query()->create([
            'slug' => 'contact',
            'content' => [
                'email' => 'info@example.test',
                'address' => 'Kabul',
            ],
            'is_published' => true,
        ]);

        $page->syncDefaultTranslation(['title' => 'Contact My School']);

        $page->translations()->create([
            'language_id' => $this->ps->id,
            'title' => 'زموږ سره اړیکه',
        ]);

        return $page;
    }
}
