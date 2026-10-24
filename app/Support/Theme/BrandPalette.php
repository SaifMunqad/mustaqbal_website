<?php

namespace App\Support\Theme;

/**
 * Derives the whole public-site branding palette from one brand color.
 *
 * The page background is deliberately NOT part of the output: `--app-bg` is
 * frozen in app.css (white in light mode, dark gray in dark mode) and branding
 * only ever paints the layers above it. Every token here is contrast-clamped,
 * so a pale, neon or very dark school color cannot produce unreadable text.
 *
 * @see resources/css/app.css for the frozen base + fallback token values
 */
final class BrandPalette
{
    /** Brand used until a school picks its own; matches the pre-branding blue. */
    public const DEFAULT_BRAND = '#2563eb';

    /** Tint strength per depth: [band/footer, card/strong]. */
    private const DEPTHS = [
        'subtle' => [0.05, 0.10],
        'medium' => [0.09, 0.16],
        'bold' => [0.14, 0.24],
    ];

    /** Frozen page backgrounds the palette is measured against (see app.css). */
    private const LIGHT_BASE = '#fdfdfc';

    private const DARK_BASE = '#0a0a0a';

    /** Minimum perceptual distance between a tint and its base surface. */
    private const MIN_TINT_DISTANCE = 0.025;

    /** @var array<string, array{light: array<string, string>, dark: array<string, string>, contrast: array<string, float>}> */
    private static array $memo = [];

    /**
     * @return array{light: array<string, string>, dark: array<string, string>, contrast: array<string, float>}
     */
    public static function make(?string $brand, ?string $accent = null, ?string $depth = null): array
    {
        $brand = Color::normalizeHex($brand) ?? self::DEFAULT_BRAND;
        $accent = Color::normalizeHex($accent);
        $depth = array_key_exists((string) $depth, self::DEPTHS) ? (string) $depth : 'subtle';

        $key = $brand.'|'.($accent ?? '-').'|'.$depth;

        if (isset(self::$memo[$key])) {
            return self::$memo[$key];
        }

        [$band, $card] = self::DEPTHS[$depth];

        $light = self::lightPalette($brand, $accent, $band, $card);
        $dark = self::darkPalette($brand, $accent, $band, $card);

        return self::$memo[$key] = [
            'light' => $light,
            'dark' => $dark,
            'contrast' => [
                'on_brand' => round(Color::contrast($light['--brand-fg'], $light['--brand']), 2),
                'on_page' => round(Color::contrast($light['--brand-ink'], self::LIGHT_BASE), 2),
                'on_dark_brand' => round(Color::contrast($dark['--brand-fg'], $dark['--brand']), 2),
                'on_dark_page' => round(Color::contrast($dark['--brand-ink'], self::DARK_BASE), 2),
            ],
        ];
    }

    /**
     * Convenience for the palette endpoint: derive a candidate without touching
     * the persisted settings row.
     *
     * @return array{light: array<string, string>, dark: array<string, string>, contrast: array<string, float>}
     */
    public static function preview(?string $brand, ?string $accent, ?string $depth): array
    {
        return self::make($brand, $accent, $depth);
    }

    /**
     * Render the palette as the two CSS blocks injected into <head>.
     *
     * @param  array{light: array<string, string>, dark: array<string, string>}  $palette
     */
    public static function toCss(array $palette): string
    {
        return ':root{'.self::declarations($palette['light']).'}'
            .'.dark{'.self::declarations($palette['dark']).'}';
    }

    /**
     * @param  array<string, string>  $tokens
     */
    private static function declarations(array $tokens): string
    {
        $declarations = [];

        foreach ($tokens as $name => $value) {
            $declarations[] = $name.':'.$value;
        }

        return implode(';', $declarations);
    }

    /**
     * @return array<string, string>
     */
    private static function lightPalette(string $brand, ?string $accent, float $bandWeight, float $cardWeight): array
    {
        // Filled brand surfaces must carry readable text. If neither white nor
        // near-black clears 4.5:1 on the raw color, darken the fill until white
        // does, so buttons never end up with washed-out labels.
        $fill = $brand;
        $onFill = self::bestForeground($fill);

        if (Color::contrast($onFill, $fill) < 4.5) {
            $fill = Color::towardContrast($fill, '#ffffff', 4.5);
            $onFill = self::bestForeground($fill);
        }

        $accentFill = $accent ?? self::autoAccent($brand, self::LIGHT_BASE);
        $deep = self::deepTone($brand, 0.29);
        [$band, $card] = self::tints($brand, self::LIGHT_BASE, $bandWeight, $cardWeight);

        return [
            '--brand' => $fill,
            '--brand-hover' => Color::shiftLightness($fill, -0.06),
            '--brand-fg' => $onFill,
            '--brand-ink' => Color::towardContrast($brand, self::LIGHT_BASE, 4.5),
            '--brand-soft' => $band,
            '--brand-soft-strong' => $card,
            '--brand-border' => self::tint($brand, self::LIGHT_BASE, max($cardWeight * 1.8, 0.18)),
            '--brand-deep' => $deep,
            '--brand-deep-fg' => self::bestForeground($deep),
            '--accent' => $accentFill,
            '--accent-fg' => self::bestForeground($accentFill),
            '--accent-ink' => Color::towardContrast($accentFill, self::LIGHT_BASE, 4.5),
            '--ink' => Color::towardContrast(self::ink($brand, 0.22), self::LIGHT_BASE, 12.0),
            '--ink-muted' => Color::towardContrast(self::ink($brand, 0.47), self::LIGHT_BASE, 4.5),
            '--ink-subtle' => Color::towardContrast(self::ink($brand, 0.62), self::LIGHT_BASE, 3.0),
        ];
    }

    /**
     * @return array<string, string>
     */
    private static function darkPalette(string $brand, ?string $accent, float $bandWeight, float $cardWeight): array
    {
        // A brand that reads fine on white is usually too dark on a near-black
        // page; lift it instead of asking the admin for a second color.
        $fill = self::darkFill($brand);

        $accentFill = $accent !== null
            ? Color::towardContrast($accent, self::DARK_BASE, 4.5)
            : self::autoAccent($brand, self::DARK_BASE);

        $deep = self::deepTone($brand, 0.32);
        [$band, $card] = self::tints($brand, self::DARK_BASE, $bandWeight * 1.4, $cardWeight * 1.2);

        return [
            '--brand' => $fill,
            '--brand-hover' => Color::shiftLightness($fill, 0.05),
            '--brand-fg' => self::bestForeground($fill),
            '--brand-ink' => Color::towardContrast($brand, self::DARK_BASE, 5.5),
            '--brand-soft' => $band,
            '--brand-soft-strong' => $card,
            '--brand-border' => self::tint($brand, self::DARK_BASE, max($cardWeight * 2.0, 0.26)),
            '--brand-deep' => $deep,
            '--brand-deep-fg' => self::bestForeground($deep),
            '--accent' => $accentFill,
            '--accent-fg' => self::bestForeground($accentFill),
            '--accent-ink' => Color::towardContrast($accentFill, self::DARK_BASE, 5.5),
            '--ink' => Color::towardContrast(self::ink($brand, 0.96), self::DARK_BASE, 12.0),
            '--ink-muted' => Color::towardContrast(self::ink($brand, 0.72), self::DARK_BASE, 4.5),
            '--ink-subtle' => Color::towardContrast(self::ink($brand, 0.60), self::DARK_BASE, 3.0),
        ];
    }

    /**
     * Band + card tint pair. The card is kept perceptibly deeper than the band,
     * so a card still reads as raised when both share the brand hue.
     *
     * @return array{0: string, 1: string}
     */
    private static function tints(string $brand, string $base, float $bandWeight, float $cardWeight): array
    {
        [$band, $effective] = self::tintWithWeight($brand, $base, $bandWeight);
        [$card] = self::tintWithWeight($brand, $base, max($cardWeight, $effective + 0.06));

        return [$band, $card];
    }

    /**
     * Tint that steps its strength up while the result is still perceptually
     * indistinguishable from the surface (pale brands mixed into near-white).
     *
     * @return array{0: string, 1: float} the tint and the weight actually used
     */
    private static function tintWithWeight(string $brand, string $base, float $weight): array
    {
        $weight = max(0.0, min(0.6, $weight));
        $color = self::tint($brand, $base, $weight);

        while (Color::distance($color, $base) < self::MIN_TINT_DISTANCE && $weight < 0.55) {
            $weight += 0.04;
            $color = self::tint($brand, $base, $weight);
        }

        return [$color, $weight];
    }

    /**
     * Mix the brand into a surface, restating part of its chroma at the mixed
     * lightness: plain mixing washes a tint toward gray (navy bands go slate).
     *
     * The lightness is also pulled away from the surface by a fraction of the
     * weight, so a tint is guaranteed to be visible even when the brand is as
     * light as the page itself (pale yellow, cream, off-white).
     */
    private static function tint(string $brand, string $base, float $weight): string
    {
        $weight = max(0.0, min(0.6, $weight));
        $chroma = min(Color::chroma($brand) * $weight * 2.6, 0.085);

        $baseLightness = Color::lightness($base);
        $mixedLightness = Color::lightness(Color::mix($brand, $base, $weight));
        $separation = 0.5 * $weight;
        $direction = $baseLightness >= 0.5 ? -1.0 : 1.0;
        $target = $baseLightness + $direction * $separation;
        $lightness = $direction < 0
            ? min($mixedLightness, $target)
            : max($mixedLightness, $target);

        return Color::withChroma(Color::withLightness($brand, $lightness), $chroma);
    }

    /**
     * Dark tone used by inverted bands (the old blue-950 blocks).
     */
    private static function deepTone(string $brand, float $lightness): string
    {
        return Color::withChroma(
            Color::withLightness($brand, $lightness),
            min(Color::chroma($brand), 0.12),
        );
    }

    /**
     * Dark-mode brand fill. A filled button has to stand out from the near-black
     * page (3:1, the WCAG non-text threshold) AND carry readable text (4.5:1);
     * those two windows only overlap narrowly, so lift the color in fine steps.
     */
    private static function darkFill(string $brand): string
    {
        $start = Color::lightness($brand);

        for ($step = 0; $step <= 100; $step++) {
            $candidate = Color::withLightness($brand, $start + $step * 0.01);

            if (Color::contrast($candidate, self::DARK_BASE) >= 4.0
                && Color::contrast(self::bestForeground($candidate), $candidate) >= 4.5) {
                return $candidate;
            }

            if ($start + $step * 0.01 >= 1.0) {
                break;
            }
        }

        return Color::withLightness($brand, min(1.0, $start + 0.3));
    }

    /**
     * Text/ink color: a neutral at the requested lightness with just a hint of
     * the brand hue, so copy harmonizes without turning into a colored body.
     */
    private static function ink(string $brand, float $lightness): string
    {
        return Color::desaturate(Color::withLightness($brand, $lightness), 0.07);
    }

    /**
     * Nearest of near-white / near-black, so filled surfaces always carry the
     * label color with the higher contrast.
     */
    private static function bestForeground(string $fill): string
    {
        return Color::contrast('#ffffff', $fill) >= Color::contrast('#111111', $fill)
            ? '#ffffff'
            : '#111111';
    }

    /**
     * Companion hue used when the school supplies no accent: 150 degrees away
     * (blue -> amber), chroma capped and contrast-checked so it stays usable.
     */
    private static function autoAccent(string $brand, string $base): string
    {
        $accent = Color::rotateHue($brand, 150.0, 0.16);

        // Keep the companion hue saturated enough to read as a color rather than
        // a gray, especially for low-chroma brands.
        $accent = Color::withChroma($accent, min(max(Color::chroma($brand), 0.09), 0.16));

        return Color::towardContrast($accent, $base, 3.0);
    }
}
