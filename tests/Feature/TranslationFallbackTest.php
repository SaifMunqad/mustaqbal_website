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

        Language::flushCache();

        $this->language('en', true);
        $this->language('ps', false);
    }

    public function test_default_locale_uses_parent_value_not_a_secondary_language_row(): void
    {
        $ps = Language::where('code', 'ps')->first();

        // A persisted row seeded with the English defaults on the parent columns.
        $setting = SiteSetting::resolved();

        // Only a Pashto row exists — exactly what the dashboard update produces,
        // since the default language is mirrored onto the parent, not stored as a row.
        $setting->translations()->create([
            'language_id' => $ps->id,
            'brand_name' => 'مستقبل ښوونځی',
            'home_stats' => [['value' => '۱۲۰۰+', 'label' => 'زده‌کوونکي']],
        ]);

        $setting->load('translations.language');

        // English (default) visitor resolves from the parent, NOT the Pashto row.
        app()->setLocale('en');
        $this->assertSame('Mustaqbal School', $setting->translated('brand_name'));
        $this->assertSame('Students', $setting->translated('home_stats')[0]['label']);

        // Pashto visitor still gets the Pashto row.
        app()->setLocale('ps');
        $this->assertSame('مستقبل ښوونځی', $setting->translated('brand_name'));
    }

    public function test_shared_settings_do_not_bleed_for_the_default_locale(): void
    {
        $ps = Language::where('code', 'ps')->first();

        $setting = SiteSetting::resolved();
        $setting->translations()->create(['language_id' => $ps->id, 'brand_name' => 'پښتو']);
        $setting->load('translations.language');

        app()->setLocale('en');

        $this->assertSame('Mustaqbal School', $setting->toShared()['brand_name']);
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
