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
 * Covers the per-section save flow of the dashboard settings page: each section
 * validates and persists only its own fields, so saving social links can never
 * fail on (or clear) the branding copy and vice versa.
 */
class SiteSettingSectionUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Language::query()->updateOrCreate(['code' => 'en'], ['name' => 'English', 'dir' => 'ltr', 'is_active' => true, 'is_default' => true, 'sort_order' => 1]);
        Language::query()->updateOrCreate(['code' => 'ps'], ['name' => 'Pashto', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 2]);
        Language::query()->where('code', 'en')->firstOrFail()->makeDefault();

        Language::flushCache();
    }

    public function test_a_section_save_writes_only_its_own_fields(): void
    {
        $setting = SiteSetting::query()->create([
            ...SiteSetting::defaults(),
            'tagline' => 'Original tagline',
            'home_title' => 'Original home title',
            'brand_color' => '#1e3a8a',
        ]);

        $ps = Language::query()->where('code', 'ps')->firstOrFail();
        $setting->translations()->create([
            'language_id' => $ps->id,
            'home_title' => 'د زما ښوونځي سرلیک',
        ]);

        $this->actingAs($this->managementUser())
            ->put('/dashboard/site-settings', [
                'section' => 'social',
                'social_facebook' => 'https://facebook.com/myschool',
            ])
            ->assertRedirect(route('dashboard.site-settings.edit'))
            ->assertSessionHasNoErrors();

        $setting = $setting->fresh(['translations.language']);

        $this->assertSame('https://facebook.com/myschool', $setting->social_facebook);

        // Untouched sections keep their stored values.
        $this->assertSame('Original tagline', $setting->tagline);
        $this->assertSame('Original home title', $setting->home_title);
        $this->assertSame('#1e3a8a', $setting->brand_color);
        $this->assertSame(
            'د زما ښوونځي سرلیک',
            $setting->translations->firstWhere('language.code', 'ps')->home_title,
        );
    }

    public function test_a_section_save_does_not_require_other_sections_fields(): void
    {
        SiteSetting::query()->create(SiteSetting::defaults());

        // No translations payload and no brand name: both belong to the identity
        // section, so a contact save must not fail on them.
        $this->actingAs($this->managementUser())
            ->put('/dashboard/site-settings', [
                'section' => 'contact',
                'contact_email' => 'office@example.com',
                'contact_phone_primary' => '+93700000000',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('office@example.com', SiteSetting::current()->contact_email);
    }

    public function test_identity_saves_still_require_the_default_brand_name(): void
    {
        SiteSetting::query()->create(SiteSetting::defaults());

        $this->actingAs($this->managementUser())
            ->put('/dashboard/site-settings', [
                'section' => 'identity',
                'translations' => [
                    'en' => ['brand_name' => '', 'brand_short_name' => ''],
                ],
            ])
            ->assertSessionHasErrors([
                'translations.en.brand_name',
                'translations.en.brand_short_name',
            ]);
    }

    public function test_a_section_save_cannot_smuggle_in_other_sections_translations(): void
    {
        $setting = SiteSetting::query()->create(SiteSetting::defaults());

        $this->actingAs($this->managementUser())
            ->put('/dashboard/site-settings', [
                'section' => 'appearance',
                'brand_color' => '#16a34a',
                'translations' => [
                    'en' => ['home_title' => 'Injected title'],
                ],
            ])
            ->assertSessionHasNoErrors();

        // `home` is not the submitted section, so its fields are ignored.
        $this->assertNotSame('Injected title', $setting->fresh()->home_title);
    }

    public function test_unknown_sections_are_rejected(): void
    {
        SiteSetting::query()->create(SiteSetting::defaults());

        $this->actingAs($this->managementUser())
            ->put('/dashboard/site-settings', ['section' => 'bogus'])
            ->assertSessionHasErrors(['section']);
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
