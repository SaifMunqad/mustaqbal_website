<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Language;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers the translatable Site Settings layer: the public `toShared()` payload
 * resolves the reader's language (falling back to the English parent column), and
 * the dashboard update flow mirrors the default language onto the parent while
 * writing a translation row per other language. Only global branding, tagline and
 * footer text are settings — page content lives in the page builder.
 */
class SiteSettingTranslationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // updateOrCreate: Dari (fa_AF) already exists from its migration insert,
        // so seeding fixtures here must be idempotent rather than a raw create.
        Language::query()->updateOrCreate(['code' => 'en'], ['name' => 'English', 'dir' => 'ltr', 'is_active' => true, 'is_default' => true, 'sort_order' => 1]);
        Language::query()->updateOrCreate(['code' => 'ps'], ['name' => 'Pashto', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 2]);
        Language::query()->updateOrCreate(['code' => 'fa_AF'], ['name' => 'Dari', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 3]);

        Language::query()->where('code', 'en')->firstOrFail()->makeDefault();

        Language::flushCache();
    }

    public function test_to_shared_returns_null_for_secondary_locale_without_a_row(): void
    {
        SiteSetting::query()->create(SiteSetting::defaults());

        app()->setLocale('fa_AF');

        $shared = SiteSetting::current()->toShared();

        // No Dari rows yet: null is returned so the frontend uses its bundled
        // i18n text (which IS in Dari) rather than a wrong-language DB fallback.
        $this->assertNull($shared['tagline']);
        $this->assertNull($shared['footer_text']);
        $this->assertNull($shared['brand_name']);

        // The home hero / stats / features are builder blocks now, so they are no
        // longer part of the shared settings payload.
        $this->assertArrayNotHasKey('home', $shared);
        $this->assertArrayNotHasKey('stats', $shared);
        $this->assertArrayNotHasKey('features', $shared);
    }

    public function test_to_shared_resolves_default_locale_from_parent_columns(): void
    {
        SiteSetting::query()->create(SiteSetting::defaults());

        app()->setLocale('en');

        $shared = SiteSetting::current()->toShared();

        // Default locale: parent columns are the source of truth.
        $this->assertSame('Building tomorrow with quality education', $shared['tagline']);
        $this->assertSame('All rights reserved.', $shared['footer_text']);
        $this->assertSame('My School', $shared['brand_name']);
    }

    public function test_to_shared_returns_the_active_language_copy(): void
    {
        $setting = SiteSetting::query()->create(SiteSetting::defaults());
        $ps = Language::query()->where('code', 'ps')->firstOrFail();

        $setting->translations()->create([
            'language_id' => $ps->id,
            'tagline' => 'د کیفیت‌لرونکې زده‌کړې سره سبا جوړول',
            'footer_text' => 'ټول حقونه خوندي دي.',
        ]);

        app()->setLocale('ps');

        $shared = $setting->fresh(['translations.language'])->toShared();

        $this->assertSame('د کیفیت‌لرونکې زده‌کړې سره سبا جوړول', $shared['tagline']);
        $this->assertSame('ټول حقونه خوندي دي.', $shared['footer_text']);
    }

    public function test_update_mirrors_default_and_writes_a_row_per_language(): void
    {
        $this->actingAs($this->managementUser());

        $response = $this->put('/dashboard/site-settings', [
            'translations' => [
                'en' => [
                    'brand_name' => 'My School',
                    'brand_short_name' => 'My School',
                    'tagline' => 'Building tomorrow',
                    'footer_text' => 'All rights reserved.',
                ],
                'ps' => [
                    'brand_name' => 'د زما ښوونځی',
                    'tagline' => 'سبا جوړول',
                ],
                'fa_AF' => [
                    'tagline' => 'فردا سازی',
                ],
            ],
        ]);

        $response->assertRedirect(route('dashboard.site-settings.edit'));
        $response->assertSessionHasNoErrors();

        $setting = SiteSetting::current();

        // Default language mirrored onto the parent row.
        $this->assertSame('My School', $setting->brand_name);
        $this->assertSame('My School', $setting->brand_short_name);
        $this->assertSame('Building tomorrow', $setting->tagline);
        $this->assertSame('All rights reserved.', $setting->footer_text);

        // Secondary languages persisted as translation rows.
        $byCode = $setting->translations()->with('language')->get()
            ->keyBy(fn ($t) => $t->language->code);

        $this->assertSame('د زما ښوونځی', $byCode['ps']->brand_name);
        $this->assertSame('سبا جوړول', $byCode['ps']->tagline);
        $this->assertSame('فردا سازی', $byCode['fa_AF']->tagline);

        // Default language is NOT duplicated as a translation row (parent is the source).
        $this->assertNull($byCode['en'] ?? null);
    }

    public function test_update_drops_a_language_whose_fields_are_all_blank(): void
    {
        $this->actingAs($this->managementUser());

        $this->put('/dashboard/site-settings', [
            'translations' => [
                'en' => [
                    'brand_name' => 'My School',
                    'brand_short_name' => 'My School',
                    'tagline' => 'Building tomorrow',
                ],
                'ps' => [
                    'brand_name' => '',
                    'tagline' => '   ',
                ],
            ],
        ])->assertSessionHasNoErrors();

        // Blank values are never written as rows, so Pashto keeps falling back to
        // the parent instead of rendering an empty tagline.
        $this->assertNull(
            SiteSetting::current()->translations()->whereHas('language', fn ($q) => $q->where('code', 'ps'))->first()
        );
    }

    private function managementUser(): User
    {
        return User::query()->create([
            'name' => 'Manager',
            'email' => 'manager@example.com',
            'password' => 'password',
            'role' => UserRole::Management->value,
            'status' => UserStatus::Active->value,
            'email_verified_at' => now(),
        ]);
    }
}
