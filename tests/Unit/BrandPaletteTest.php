<?php

namespace Tests\Unit;

use App\Support\Theme\BrandPalette;
use App\Support\Theme\Color;
use Tests\TestCase;

/**
 * Covers the branding palette derivation: whatever color a school picks, the
 * derived tokens have to stay readable and visibly tinted, and the frozen page
 * background must never be part of the output.
 */
class BrandPaletteTest extends TestCase
{
    /**
     * Awkward brand colors: black, white, a pale yellow, a navy, a mid gray, a
     * saturated green and a two-color combo.
     *
     * @return array<string, array{0: string}>
     */
    public static function brands(): array
    {
        return [
            'black' => ['#000000'],
            'white' => ['#ffffff'],
            'pale yellow' => ['#fef9c3'],
            'navy' => ['#1e3a8a'],
            'mid gray' => ['#7c7c7c'],
            'green' => ['#16a34a'],
            'magenta' => ['#db2777'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('brands')]
    public function test_text_on_a_brand_fill_meets_wcag_aa(string $brand): void
    {
        $palette = BrandPalette::make($brand);

        $this->assertGreaterThanOrEqual(
            4.5,
            Color::contrast($palette['light']['--brand-fg'], $palette['light']['--brand']),
            "Label on the light-mode brand fill is unreadable for {$brand}.",
        );
        $this->assertGreaterThanOrEqual(
            4.5,
            Color::contrast($palette['dark']['--brand-fg'], $palette['dark']['--brand']),
            "Label on the dark-mode brand fill is unreadable for {$brand}.",
        );
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('brands')]
    public function test_brand_text_on_the_frozen_page_background_is_readable(string $brand): void
    {
        $palette = BrandPalette::make($brand);

        $this->assertGreaterThanOrEqual(
            4.5,
            Color::contrast($palette['light']['--brand-ink'], '#fdfdfc'),
            "Links would be unreadable on the light page for {$brand}.",
        );
        $this->assertGreaterThanOrEqual(
            4.5,
            Color::contrast($palette['dark']['--brand-ink'], '#0a0a0a'),
            "Links would be unreadable on the dark page for {$brand}.",
        );
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('brands')]
    public function test_dark_mode_brand_fill_stands_out_from_the_page(string $brand): void
    {
        $palette = BrandPalette::make($brand);

        $this->assertGreaterThanOrEqual(
            3.0,
            Color::contrast($palette['dark']['--brand'], '#0a0a0a'),
            "The dark-mode brand fill disappears into the page for {$brand}.",
        );
    }

    public function test_pale_brands_still_produce_a_visible_tint(): void
    {
        // A cream brand mixed into the near-white page would otherwise vanish.
        $palette = BrandPalette::make('#fef9c3');

        $this->assertGreaterThanOrEqual(
            0.025,
            Color::distance($palette['light']['--brand-soft'], '#fdfdfc'),
        );
        // Bands and cards must not collapse into the same wash.
        $this->assertGreaterThan(
            0.01,
            Color::distance($palette['light']['--brand-soft'], $palette['light']['--brand-soft-strong']),
        );
    }

    public function test_tint_depth_increases_the_section_tint(): void
    {
        $subtle = BrandPalette::make('#2563eb', null, 'subtle');
        $bold = BrandPalette::make('#2563eb', null, 'bold');

        $this->assertGreaterThan(
            Color::distance($subtle['light']['--brand-soft'], '#fdfdfc'),
            Color::distance($bold['light']['--brand-soft'], '#fdfdfc'),
        );
    }

    public function test_the_frozen_page_background_is_never_derived(): void
    {
        $palette = BrandPalette::make('#16a34a');

        foreach (['light', 'dark'] as $mode) {
            // The page background is owned by app.css; the palette must not be
            // able to repaint it, whatever the school picks.
            $this->assertArrayNotHasKey('--app-bg', $palette[$mode]);
            $this->assertArrayNotHasKey('--app-bg-header', $palette[$mode]);
        }
    }

    public function test_a_missing_accent_is_derived_from_the_brand(): void
    {
        $palette = BrandPalette::make('#2563eb');

        $this->assertNotSame(
            $palette['light']['--brand'],
            $palette['light']['--accent'],
            'The auto accent must be distinguishable from the brand fill.',
        );
        $this->assertGreaterThanOrEqual(
            3.0,
            Color::contrast($palette['light']['--accent'], '#fdfdfc'),
        );
    }

    public function test_a_supplied_accent_wins_and_is_normalized(): void
    {
        $palette = BrandPalette::make('#2563EB', '#F59E0B', 'medium');

        $this->assertSame('#2563eb', $palette['light']['--brand']);
        $this->assertSame('#f59e0b', $palette['light']['--accent']);
    }

    public function test_input_is_validated_and_defaults_apply(): void
    {
        $fallback = BrandPalette::make(BrandPalette::DEFAULT_BRAND, null, 'subtle');

        // Garbage and unknown depths fall back instead of throwing.
        $this->assertSame($fallback, BrandPalette::make(null, null, 'nonsense'));
        $this->assertSame($fallback, BrandPalette::make('not-a-color'));
    }

    public function test_derivation_is_deterministic(): void
    {
        $this->assertSame(
            BrandPalette::make('#db2777', '#0891b2', 'bold'),
            BrandPalette::make('#db2777', '#0891b2', 'bold'),
        );
    }

    public function test_css_output_declares_both_schemes(): void
    {
        $css = BrandPalette::toCss(BrandPalette::make('#2563eb'));

        $this->assertStringStartsWith(':root{--brand:', $css);
        $this->assertStringContainsString('.dark{--brand:', $css);
    }
}
