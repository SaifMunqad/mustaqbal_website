<?php

namespace Tests\Feature;

use App\Models\Language;
use App\Models\SiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards the language-bleed bug: a visitor on the default language must never be
 * served another language's data. This used to happen because translation
 * resolution fell back to an arbitrary first row when the requested/default
 * language had no row — which is the normal state for SiteSetting, whose
 * default-language text lives on the parent columns instead of a row.
 */
class TranslationFallbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->language('en', true);
        $this->language('ps', false);

        // Ensure only 'en' is flagged as default; the migration may have
        // inserted 'fa_AF' as the site default.
        Language::query()->where('code', 'en')->firstOrFail()->makeDefault();

        Language::flushCache();
    }

    public function test_default_locale_uses_parent_value_not_a_secondary_language_row(): void
    {
        $ps = Language::where('code', 'ps')->first();

        // A persisted row. Seed an explicit English tagline on the parent columns
        // so the assertion below checks the fallback chain itself, not any demo
        // defaults.
        $setting = SiteSetting::resolved();
        $setting->update(['tagline' => 'Building tomorrow']);

        // Only a Pashto row exists — exactly what the dashboard update produces,
        // since the default language is mirrored onto the parent, not stored as a row.
        $setting->translations()->create([
            'language_id' => $ps->id,
            'brand_name' => 'زما ښوونځی',
            'tagline' => 'سبا جوړول',
        ]);

        $setting->load('translations.language');

        // English (default) visitor resolves from the parent, NOT the Pashto row.
        app()->setLocale('en');
        $this->assertSame('My School', $setting->translated('brand_name'));
        $this->assertSame('Building tomorrow', $setting->translated('tagline'));

        // Pashto visitor still gets the Pashto row.
        app()->setLocale('ps');
        $this->assertSame('زما ښوونځی', $setting->translated('brand_name'));
        $this->assertSame('سبا جوړول', $setting->translated('tagline'));
    }

    public function test_shared_settings_do_not_bleed_for_the_default_locale(): void
    {
        $ps = Language::where('code', 'ps')->first();

        $setting = SiteSetting::resolved();
        $setting->translations()->create(['language_id' => $ps->id, 'brand_name' => 'پښتو']);
        $setting->load('translations.language');

        app()->setLocale('en');

        $this->assertSame('My School', $setting->toShared()['brand_name']);
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
