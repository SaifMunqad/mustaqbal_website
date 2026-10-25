<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Language;
use App\Models\SitePage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Covers the About page dashboard surfaces after the builder cutover:
 * `/dashboard/about` only owns publishing, while `/dashboard/pages/about`
 * serves the unified page builder for the `about` page key.
 */
class AboutPageEditorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        Language::query()->delete();
        Language::flushCache();

        $this->language('en', true);
        $this->language('ps', false);
    }

    public function test_update_stores_the_publishing_flag_only(): void
    {
        $page = $this->aboutPage();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.about.update'), [
                'is_published' => false,
                // Legacy/editor fields must be ignored, never written by this
                // screen (content is owned by the builder).
                'slug' => 'hacked',
                'translations' => ['en' => ['title' => 'Nope']],
            ])
            ->assertRedirect(route('dashboard.about.edit'));

        $page->refresh();

        $this->assertFalse($page->is_published);
        $this->assertSame('about', $page->slug);
    }

    public function test_builder_renders_the_about_page_for_management(): void
    {
        $page = $this->aboutPage();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->get(route('dashboard.pages.about'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('dashboard/page-builder/dashboard-page-builder-about')
                ->where('page.key', 'about')
                ->where('page.save_url', route('dashboard.pages.about.save'))
                ->where('page.index_url', route('dashboard.about.edit'))
                ->where('page.label', 'About page')
                ->where('page.label_key', 'dashboard.about.title')
                ->has('sections')
                ->has('palette')
                ->where('defaultLanguage', 'en')
            );

        $this->assertDatabaseHas('pages', ['key' => 'about']);
        $this->assertSame('about', $page->refresh()->slug);
    }

    public function test_builder_is_management_only(): void
    {
        $this->aboutPage();

        $this->actingAs(User::factory()->create(['role' => UserRole::Family->value]))
            ->get(route('dashboard.pages.about'))
            ->assertForbidden();
    }

    private function aboutPage(): SitePage
    {
        $page = SitePage::query()->create([
            'slug' => 'about',
            'content' => [],
            'is_published' => true,
        ]);

        $page->syncDefaultTranslation(['title' => 'About', 'body' => '<p>story</p>']);

        return $page;
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
}
