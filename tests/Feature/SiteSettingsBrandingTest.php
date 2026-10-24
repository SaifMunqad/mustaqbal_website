<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Language;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Covers the branding settings flow: the admin picks a color (plus an optional
 * accent and tint depth), the backend persists it, shares the derived palette
 * with Inertia and injects it into the root Blade view before first paint.
 */
class SiteSettingsBrandingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Language::query()->updateOrCreate(['code' => 'en'], ['name' => 'English', 'dir' => 'ltr', 'is_active' => true, 'is_default' => true, 'sort_order' => 1]);
        Language::query()->where('code', 'en')->firstOrFail()->makeDefault();
        Language::flushCache();
    }

    public function test_branding_fields_are_persisted_and_normalized(): void
    {
        $this->actingAs($this->managementUser())
            ->put('/dashboard/site-settings', $this->payload([
                'brand_color' => '#1E3A8A',
                'accent_color' => '#F59E0B',
                'tint_depth' => 'medium',
            ]))
            ->assertRedirect(route('dashboard.site-settings.edit'))
            ->assertSessionHasNoErrors();

        $setting = SiteSetting::current();

        $this->assertSame('#1e3a8a', $setting->brand_color);
        $this->assertSame('#f59e0b', $setting->accent_color);
        $this->assertSame('medium', $setting->tint_depth);
    }

    public function test_invalid_colors_and_depths_are_rejected(): void
    {
        $this->actingAs($this->managementUser())
            ->put('/dashboard/site-settings', $this->payload([
                'brand_color' => 'navy',
                'tint_depth' => 'extreme',
            ]))
            ->assertSessionHasErrors(['brand_color', 'tint_depth']);
    }

    public function test_the_derived_palette_is_shared_with_every_page(): void
    {
        SiteSetting::query()->create([
            ...SiteSetting::defaults(),
            'brand_color' => '#1e3a8a',
            'tint_depth' => 'bold',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('site.theme.brand_color', '#1e3a8a')
                ->where('site.theme.tint_depth', 'bold')
                ->has('site.theme.palette.light')
                ->has('site.theme.palette.dark')
                ->has('site.theme.palette.contrast.on_brand')
            );
    }

    public function test_the_palette_is_injected_before_first_paint(): void
    {
        SiteSetting::query()->create([
            ...SiteSetting::defaults(),
            'brand_color' => '#16a34a',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertSee('id="brand-palette"', false)
            ->assertSee('--brand:#16a34a', false);
    }

    public function test_the_preview_endpoint_returns_a_candidate_palette(): void
    {
        $this->actingAs($this->managementUser())
            ->postJson('/dashboard/site-settings/palette', [
                'brand_color' => '#db2777',
                'accent_color' => null,
                'tint_depth' => 'medium',
            ])
            ->assertOk()
            ->assertJsonPath('light.--brand', '#db2777')
            ->assertJsonStructure([
                'light' => ['--brand', '--brand-fg', '--brand-ink', '--brand-soft', '--brand-deep'],
                'dark' => ['--brand', '--brand-fg', '--brand-ink'],
                'contrast' => ['on_brand', 'on_page', 'on_dark_brand', 'on_dark_page'],
            ]);
    }

    public function test_the_preview_endpoint_is_management_only(): void
    {
        $this->actingAs($this->userWithRole(UserRole::Family))
            ->postJson('/dashboard/site-settings/palette', ['brand_color' => '#db2777'])
            ->assertForbidden();
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function payload(array $extra): array
    {
        return [
            'translations' => [
                'en' => [
                    'brand_name' => 'My School',
                    'brand_short_name' => 'My School',
                ],
            ],
            ...$extra,
        ];
    }

    private function managementUser(): User
    {
        return $this->userWithRole(UserRole::Management);
    }

    private function userWithRole(UserRole $role): User
    {
        static $sequence = 0;
        $sequence++;

        return User::query()->create([
            'name' => 'User '.$sequence,
            'email' => "user{$sequence}@example.com",
            'password' => 'password',
            'role' => $role->value,
            'status' => UserStatus::Active->value,
            'email_verified_at' => now(),
        ]);
    }
}
