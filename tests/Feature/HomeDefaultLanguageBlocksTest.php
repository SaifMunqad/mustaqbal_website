<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Language;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Regression guard for the default-language shadowing bug in the visual home
 * editor.
 *
 * The Site Settings seeder writes a translation row for the DEFAULT language
 * (Dari here) while the parent columns stay at their (empty-list) defaults. The
 * public read resolves a translation row before the parent, so saving the
 * default language's home blocks to the parent columns only was silently
 * shadowed on the live home page — added "why families choose us" / "quick
 * stats" never appeared. The visual editor now mirrors the default-language
 * write onto its row so the saved layout always surfaces.
 */
class HomeDefaultLanguageBlocksTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        Language::flushCache();

        // Mirror the real seeded setup: fa_AF is the default language created by
        // the migration; en/ps are the secondary actives added by the seeder.
        Language::query()->updateOrCreate(
            ['code' => 'fa_AF'],
            ['name' => 'Dari', 'dir' => 'rtl', 'is_active' => true, 'is_default' => true, 'sort_order' => 1],
        );
        Language::query()->create(['code' => 'en', 'name' => 'English', 'dir' => 'ltr', 'is_active' => true, 'is_default' => false, 'sort_order' => 2]);
        Language::query()->create(['code' => 'ps', 'name' => 'Pashto', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 3]);

        // A stale default-language row pre-exists with seeded content, exactly
        // as LocalizedContent::siteSettingDefaults() leaves it on a fresh seed.
        $fa = Language::where('code', 'fa_AF')->firstOrFail();
        $setting = SiteSetting::query()->create(SiteSetting::defaults());
        $setting->translations()->create([
            'language_id' => $fa->id,
            'home_stats' => [['value' => '1,200+', 'label' => 'دانش‌آموزان']],
            'home_features' => [['icon' => 'faculty', 'title' => 'کادر شایسته', 'description' => 'seeded']],
        ]);
    }

    public function test_saving_default_language_blocks_surfaces_on_the_public_home(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.home-sections.visual.save'), [
                'sections' => [],
                'site' => [
                    'hero_image' => '',
                    'translations' => [
                        'fa_AF' => [
                            'home_stats' => [['value' => '500', 'label' => 'نوی']],
                            'home_features' => [['icon' => 'values', 'title' => 'NEW DEFAULT', 'description' => 'edited']],
                        ],
                    ],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        // The parent (what the editor shows) and the default row (what the
        // visitor reads) must both reflect the freshly-saved values.
        $setting = SiteSetting::current();
        $this->assertSame('500', $setting->home_stats[0]['value']);
        $this->assertSame('500', $setting->fresh(['translations.language'])->translations
            ->firstWhere('language.code', 'fa_AF')->home_stats[0]['value']);

        // New visitors are served the first-active language (fa_AF): the home
        // page shows the admin's edits, not the stale seeded row.
        $this->withCookieLanguage('fa_AF')
            ->get('/')
            ->assertInertia(fn (Assert $page) => $page
                ->where('site.stats.0.value', '500')
                ->where('site.features.0.title', 'NEW DEFAULT')
            );
    }

    private function withCookieLanguage(string $code): static
    {
        return $this->withCookies([
            \App\Http\Middleware\SetLocale::COOKIE => $code,
        ]);
    }
}
