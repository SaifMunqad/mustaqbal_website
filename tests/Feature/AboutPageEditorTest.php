<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Language;
use App\Models\SitePage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers localized About-page section editing: the batched save stores the
 * default language on the parent (universal fallback) and other languages as
 * per-language overrides, and the reader's merged `content` prefers a language's
 * own copy while falling back to the default for un-translated sections.
 */
class AboutPageEditorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        // Build a controlled en(default)+ps fixture: clear the language the
        // languages migration seeds by default so it is not an unexpected extra
        // active language (which would make the editor require its translations).
        Language::query()->delete();

        Language::flushCache();

        $this->language('en', true);
        $this->language('ps', false);
    }

    public function test_update_stores_default_on_parent_and_secondary_as_override(): void
    {
        $page = $this->aboutPage();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.about.update'), [
                'slug' => 'about',
                'is_published' => true,
                'video_embed' => '<iframe src="x"></iframe>',
                'translations' => [
                    'en' => ['title' => 'About', 'body' => '<p>story</p>'],
                ],
                'contents' => [
                    'en' => [
                        'mission' => 'EN mission',
                        'stats' => [['value' => '100+', 'label' => 'Students'], ['value' => '', 'label' => '']],
                        'values' => [['icon' => 'book-open', 'title' => 'Knowledge', 'text' => 'First']],
                    ],
                    'ps' => [
                        'mission' => 'PS mission',
                    ],
                ],
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $page->refresh()->load('translations.language');

        // Default language structured content lives on the parent (fallback).
        $shared = $page->sharedContent();
        $this->assertSame('EN mission', $shared['mission']);
        $this->assertSame('<iframe src="x"></iframe>', $shared['video_embed']);
        // The empty stat row was dropped by the sanitizer.
        $this->assertCount(1, $shared['stats']);

        $ps = Language::where('code', 'ps')->first();
        $psRow = $page->translations->firstWhere('language_id', $ps->id);
        $this->assertNotNull($psRow);
        $this->assertSame('PS mission', $psRow->content['mission']);

        // Reader merged content is language-aware.
        app()->setLocale('en');
        $this->assertSame('EN mission', $page->getContentAttribute()['mission']);

        app()->setLocale('ps');
        // PS overrides mission but falls back to the parent for stats.
        $merged = $page->getContentAttribute();
        $this->assertSame('PS mission', $merged['mission']);
        $this->assertSame('Students', $merged['stats'][0]['label']);
    }

    public function test_untranslated_secondary_falls_back_to_default(): void
    {
        $page = $this->aboutPage();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.about.update'), [
                'slug' => 'about',
                'is_published' => true,
                'translations' => ['en' => ['title' => 'About', 'body' => '<p>story</p>']],
                'contents' => [
                    'en' => ['vision' => 'EN vision'],
                    // Pashto submits only blanks → stored as null (no override).
                    'ps' => ['vision' => '   '],
                ],
            ])
            ->assertRedirect();

        $page->refresh()->load('translations.language');

        $ps = Language::where('code', 'ps')->first();
        $psRow = $page->translations->firstWhere('language_id', $ps->id);
        $this->assertNull($psRow?->content);

        // Pashto readers still get the default vision (parent fallback).
        app()->setLocale('ps');
        $this->assertSame('EN vision', $page->getContentAttribute()['vision']);
    }

    public function test_visual_editor_renders_for_management(): void
    {
        $page = $this->aboutPage();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->get(route('dashboard.about.visual'))
            ->assertOk()
            ->assertInertia(fn (\Inertia\Testing\AssertableInertia $p) => $p
                ->component('dashboard/about/visual')
                ->where('page.id', $page->id)
                ->has('contents')
            );
    }

    public function test_visual_editor_is_management_only(): void
    {
        $page = $this->aboutPage();

        $this->actingAs(User::factory()->create(['role' => UserRole::Family->value]))
            ->get(route('dashboard.about.visual'))
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
