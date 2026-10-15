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
 * writing a translation row per other language.
 */
class SiteSettingTranslationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Language::query()->create(['code' => 'en', 'name' => 'English', 'dir' => 'ltr', 'is_active' => true, 'is_default' => true, 'sort_order' => 1]);
        Language::query()->create(['code' => 'ps', 'name' => 'Pashto', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 2]);
        Language::query()->create(['code' => 'fa_AF', 'name' => 'Dari', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 3]);

        Language::flushCache();
    }

    public function test_to_shared_falls_back_to_english_when_no_translation_exists(): void
    {
        SiteSetting::query()->create(SiteSetting::defaults());

        app()->setLocale('fa_AF');

        $shared = SiteSetting::current()->toShared();

        // No Dari rows yet: the reader still gets the English source of truth.
        $this->assertSame('Welcome to My School', $shared['home']['title']);
    }

    public function test_to_shared_returns_the_active_language_copy(): void
    {
        $setting = SiteSetting::query()->create(SiteSetting::defaults());
        $ps = Language::query()->where('code', 'ps')->firstOrFail();

        $setting->translations()->create([
            'language_id' => $ps->id,
            'home_title' => 'د زما ښوونځي ته ښه راغلاست',
            'home_stats' => [['value' => '1,200+', 'label' => 'زده‌کوونکي']],
        ]);

        app()->setLocale('ps');

        $shared = $setting->fresh(['translations.language'])->toShared();

        $this->assertSame('د زما ښوونځي ته ښه راغلاست', $shared['home']['title']);
        $this->assertSame('زده‌کوونکي', $shared['stats'][0]['label']);
    }

    public function test_update_mirrors_default_and_writes_a_row_per_language(): void
    {
        $this->actingAs($this->managementUser());

        $response = $this->put('/dashboard/site-settings', [
            'translations' => [
                'en' => [
                    'brand_name' => 'My School',
                    'brand_short_name' => 'My School',
                    'home_title' => 'Welcome to My School',
                    'tagline' => 'Building tomorrow',
                    'home_stats' => [
                        ['value' => '900', 'label' => 'Students'],
                    ],
                ],
                'ps' => [
                    'brand_name' => 'د زما ښوونځی',
                    'home_title' => 'ښه راغلاست',
                    'home_stats' => [
                        ['value' => '900', 'label' => 'زده‌کوونکي'],
                    ],
                ],
                'fa_AF' => [
                    'home_title' => 'خوش آمدید',
                    'home_stats' => [
                        ['value' => '900', 'label' => 'دانش‌آموزان'],
                    ],
                ],
            ],
        ]);

        $response->assertRedirect(route('dashboard.site-settings.edit'));
        $response->assertSessionHasNoErrors();

        $setting = SiteSetting::current();

        // Default language mirrored onto the parent row.
        $this->assertSame('My School', $setting->brand_name);
        $this->assertSame('My School', $setting->brand_short_name);
        $this->assertSame('Welcome to My School', $setting->home_title);
        $this->assertSame('Building tomorrow', $setting->tagline);
        $this->assertSame('Students', $setting->home_stats[0]['label']);

        // Secondary languages persisted as translation rows.
        $byCode = $setting->translations()->with('language')->get()
            ->keyBy(fn ($t) => $t->language->code);

        $this->assertSame('د زما ښوونځی', $byCode['ps']->brand_name);
        $this->assertSame('ښه راغلاست', $byCode['ps']->home_title);
        $this->assertSame('زده‌کوونکي', $byCode['ps']->home_stats[0]['label']);
        $this->assertSame('خوش آمدید', $byCode['fa_AF']->home_title);

        // Default language is NOT duplicated as a translation row (parent is the source).
        $this->assertNull($byCode['en'] ?? null);
    }

    public function test_update_drops_empty_list_rows(): void
    {
        $this->actingAs($this->managementUser());

        $this->put('/dashboard/site-settings', [
            'translations' => [
                'en' => [
                    'brand_name' => 'My School',
                    'brand_short_name' => 'My School',
                    'home_title' => 'Welcome',
                    'home_stats' => [
                        ['value' => '900', 'label' => 'Students'],
                        ['value' => '', 'label' => ''],
                    ],
                ],
            ],
        ])->assertSessionHasNoErrors();

        $this->assertCount(1, SiteSetting::current()->home_stats);
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
