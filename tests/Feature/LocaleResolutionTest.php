<?php

namespace Tests\Feature;

use App\Http\Middleware\SetLocale;
use App\Models\Language;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Guards the locale-resolution contract for visitors:
 *
 *  1. No cached language          -> the site default (`is_default` row).
 *  2. Unsupported cached language -> the site default again.
 *  3. Valid cached language        -> the cached language.
 *
 * The default is intentionally NOT the highest-priority active language here
 * (`en` sorts first, `fa_AF` is the default), so a regression that reverts the
 * fallback to `firstActiveCode()` would fail these assertions.
 */
class LocaleResolutionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        Language::flushCache();

        // `en` is the first-sorted active language but NOT the default;
        // `fa_AF` is the default but sorted second. `ps` is a valid active choice.
        Language::query()->updateOrCreate(
            ['code' => 'en'],
            ['name' => 'English', 'dir' => 'ltr', 'is_active' => true, 'is_default' => false, 'sort_order' => 1],
        );
        Language::query()->updateOrCreate(
            ['code' => 'fa_AF'],
            ['name' => 'Dari', 'dir' => 'rtl', 'is_active' => true, 'is_default' => true, 'sort_order' => 2],
        );
        Language::query()->create(['code' => 'ps', 'name' => 'Pashto', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 3]);
    }

    public function test_new_visitor_is_served_the_default_language_not_the_first_active(): void
    {
        $this->withoutCookieLanguage()
            ->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('languages.current', 'fa_AF'));
    }

    public function test_unsupported_cached_language_falls_back_to_the_default(): void
    {
        $this->withCookieLanguage('zz')
            ->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('languages.current', 'fa_AF'));
    }

    public function test_disabled_cached_language_falls_back_to_the_default(): void
    {
        // A previously-chosen language that has since been deactivated.
        Language::query()->where('code', 'ps')->update(['is_active' => false]);
        Language::flushCache();

        $this->withCookieLanguage('ps')
            ->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('languages.current', 'fa_AF'));
    }

    public function test_valid_cached_language_is_respected(): void
    {
        $this->withCookieLanguage('ps')
            ->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('languages.current', 'ps'));
    }

    private function withCookieLanguage(string $code): static
    {
        return $this->withCookies([SetLocale::COOKIE => $code]);
    }

    private function withoutCookieLanguage(): static
    {
        return $this->withCookies([]);
    }
}
