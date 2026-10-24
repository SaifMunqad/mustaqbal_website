<?php

namespace App\Support\Theme;

/**
 * Color math for the branding palette: sRGB hex <-> OKLab conversion, OKLab
 * mixing and WCAG contrast ratios.
 *
 * Dependency free on purpose: the palette is derived inside the root Blade view
 * before first paint, so it must not need a service container, a driver or a
 * database round trip. OKLab (rather than sRGB or HSL) is the working space
 * because mixing tints there keeps a brand hue stable and lets us measure
 * "is this tint even visible?" with a perceptual distance.
 */
final class Color
{
    /**
     * Normalize user input to a lowercase `#rrggbb` string, or null when the
     * value is not a usable hex color.
     */
    public static function normalizeHex(?string $hex): ?string
    {
        $value = strtolower(ltrim(trim((string) $hex), '#'));

        if (strlen($value) === 3) {
            $value = $value[0].$value[0].$value[1].$value[1].$value[2].$value[2];
        }

        return preg_match('/^[0-9a-f]{6}$/', $value) === 1 ? '#'.$value : null;
    }

    /**
     * @return array{0: float, 1: float, 2: float} sRGB channels in 0..1
     */
    public static function hexToRgb(string $hex): array
    {
        $value = substr(self::normalizeHex($hex) ?? '#000000', 1);

        return [
            hexdec(substr($value, 0, 2)) / 255,
            hexdec(substr($value, 2, 2)) / 255,
            hexdec(substr($value, 4, 2)) / 255,
        ];
    }

    /**
     * @param  array{0: float, 1: float, 2: float}  $rgb
     */
    public static function rgbToHex(array $rgb): string
    {
        $channels = array_map(
            static fn (float $channel): int => (int) round(max(0.0, min(1.0, $channel)) * 255),
            array_values($rgb),
        );

        return sprintf('#%02x%02x%02x', $channels[0], $channels[1], $channels[2]);
    }

    /**
     * @return array{0: float, 1: float, 2: float} OKLab L (0..1), a, b
     */
    public static function hexToOklab(string $hex): array
    {
        [$r, $g, $b] = array_map(self::toLinear(...), self::hexToRgb($hex));

        $l = 0.4122214708 * $r + 0.5363325363 * $g + 0.0514459929 * $b;
        $m = 0.2119034982 * $r + 0.6806995451 * $g + 0.1073969566 * $b;
        $s = 0.0883024619 * $r + 0.2817188376 * $g + 0.6299787005 * $b;

        $l = $l ** (1 / 3);
        $m = $m ** (1 / 3);
        $s = $s ** (1 / 3);

        return [
            0.2104542553 * $l + 0.7936177850 * $m - 0.0040720468 * $s,
            1.9779984951 * $l - 2.4285922050 * $m + 0.4505937099 * $s,
            0.0259040371 * $l + 0.7827717662 * $m - 0.8086757660 * $s,
        ];
    }

    /**
     * @param  array{0: float, 1: float, 2: float}  $lab
     */
    public static function oklabToHex(array $lab): string
    {
        [$r, $g, $b] = self::oklabToLinear($lab);

        // Gamut mapping: reduce chroma towards the neutral axis until every
        // channel fits inside sRGB. Cheap, and good enough for UI colors.
        $desaturation = 0.0;
        while (self::outOfGamut($r, $g, $b) && $desaturation < 1.0) {
            $desaturation += 0.02;
            [$r, $g, $b] = self::oklabToLinear([
                $lab[0],
                $lab[1] * (1 - $desaturation),
                $lab[2] * (1 - $desaturation),
            ]);
        }

        return self::rgbToHex([
            self::fromLinear($r),
            self::fromLinear($g),
            self::fromLinear($b),
        ]);
    }

    /**
     * Mix two colors in OKLab. `$weight` is the share of `$a` (0..1).
     */
    public static function mix(string $a, string $b, float $weight): string
    {
        $weight = max(0.0, min(1.0, $weight));
        $from = self::hexToOklab($a);
        $to = self::hexToOklab($b);

        return self::oklabToHex([
            $from[0] * $weight + $to[0] * (1 - $weight),
            $from[1] * $weight + $to[1] * (1 - $weight),
            $from[2] * $weight + $to[2] * (1 - $weight),
        ]);
    }

    /**
     * WCAG relative luminance.
     */
    public static function luminance(string $hex): float
    {
        [$r, $g, $b] = array_map(self::toLinear(...), self::hexToRgb($hex));

        return 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;
    }

    /**
     * WCAG contrast ratio between two colors (1..21).
     */
    public static function contrast(string $a, string $b): float
    {
        $first = self::luminance($a);
        $second = self::luminance($b);

        return (max($first, $second) + 0.05) / (min($first, $second) + 0.05);
    }

    /**
     * Perceptual distance in OKLab, used to detect tints that are invisible
     * against their base surface (e.g. a pale yellow brand mixed into white).
     */
    public static function distance(string $a, string $b): float
    {
        $first = self::hexToOklab($a);
        $second = self::hexToOklab($b);

        return sqrt(
            ($first[0] - $second[0]) ** 2
            + ($first[1] - $second[1]) ** 2
            + ($first[2] - $second[2]) ** 2
        );
    }

    /**
     * Chroma (saturation) of a color on the OKLab plane, 0..~0.4.
     */
    public static function chroma(string $hex): float
    {
        $lab = self::hexToOklab($hex);

        return sqrt($lab[1] ** 2 + $lab[2] ** 2);
    }

    /**
     * Perceptual lightness of a color, 0..1.
     */
    public static function lightness(string $hex): float
    {
        return self::hexToOklab($hex)[0];
    }

    /**
     * Replace a color's chroma, keeping its hue and lightness.
     */
    public static function withChroma(string $hex, float $chroma): string
    {
        $lab = self::hexToOklab($hex);
        $angle = atan2($lab[2], $lab[1]);

        return self::oklabToHex([
            $lab[0],
            max(0.0, $chroma) * cos($angle),
            max(0.0, $chroma) * sin($angle),
        ]);
    }

    /**
     * Replace a color's lightness, keeping its hue and chroma.
     */
    public static function withLightness(string $hex, float $lightness): string
    {
        $lab = self::hexToOklab($hex);
        $lab[0] = max(0.0, min(1.0, $lightness));

        return self::oklabToHex($lab);
    }

    /**
     * Move a color's lightness by a relative amount (hover/pressed states).
     */
    public static function shiftLightness(string $hex, float $delta): string
    {
        $lab = self::hexToOklab($hex);

        return self::withLightness($hex, max(0.02, min(0.99, $lab[0] + $delta)));
    }

    /**
     * Scale a color's chroma, keeping hue and lightness.
     */
    public static function desaturate(string $hex, float $factor): string
    {
        $lab = self::hexToOklab($hex);
        $lab[1] *= $factor;
        $lab[2] *= $factor;

        return self::oklabToHex($lab);
    }

    /**
     * Rotate a color's hue by `$degrees`, capping its chroma so the companion
     * hue cannot become neon.
     */
    public static function rotateHue(string $hex, float $degrees, float $chromaCap = 0.16): string
    {
        $lab = self::hexToOklab($hex);
        $chroma = min(self::chroma($hex), $chromaCap);
        $angle = atan2($lab[2], $lab[1]) + deg2rad($degrees);

        return self::oklabToHex([$lab[0], $chroma * cos($angle), $chroma * sin($angle)]);
    }

    /**
     * Walk a color away from a reference color (darker if it starts darker,
     * lighter if it starts lighter) until it reaches the required contrast.
     *
     * This is the single accessibility guard used by the palette: whatever a
     * school picks, the derived token clears a real WCAG threshold instead of
     * relying on the admin to judge it.
     */
    public static function towardContrast(string $hex, string $against, float $target): string
    {
        if (self::contrast($hex, $against) >= $target) {
            return $hex;
        }

        $start = self::hexToOklab($hex);

        // Walk away from the reference color; when that direction runs out of
        // room (a pure white brand on a white page) walk the other way instead.
        $directions = self::luminance($hex) <= self::luminance($against)
            ? [-1.0, 1.0]
            : [1.0, -1.0];

        foreach ($directions as $direction) {
            for ($step = 1; $step <= 100; $step++) {
                $lab = $start;
                $lab[0] = max(0.0, min(1.0, $start[0] + $direction * $step * 0.01));
                $candidate = self::oklabToHex($lab);

                if (self::contrast($candidate, $against) >= $target) {
                    return $candidate;
                }

                if ($lab[0] <= 0.0 || $lab[0] >= 1.0) {
                    break;
                }
            }
        }

        return self::oklabToHex($start);
    }

    /**
     * @return array{0: float, 1: float, 2: float} linear-light sRGB
     */
    private static function oklabToLinear(array $lab): array
    {
        [$l, $a, $b] = $lab;

        $l_ = $l + 0.3963377774 * $a + 0.2158037573 * $b;
        $m_ = $l - 0.1055613458 * $a - 0.0638541728 * $b;
        $s_ = $l - 0.0894841775 * $a - 1.2914855480 * $b;

        $l3 = $l_ ** 3;
        $m3 = $m_ ** 3;
        $s3 = $s_ ** 3;

        return [
            4.0767416621 * $l3 - 3.3077115913 * $m3 + 0.2309699292 * $s3,
            -1.2684380046 * $l3 + 2.6097574011 * $m3 - 0.3413193965 * $s3,
            -0.0041960863 * $l3 - 0.7034186147 * $m3 + 1.7076147010 * $s3,
        ];
    }

    private static function outOfGamut(float $r, float $g, float $b): bool
    {
        return $r < -0.0001 || $r > 1.0001
            || $g < -0.0001 || $g > 1.0001
            || $b < -0.0001 || $b > 1.0001;
    }

    private static function toLinear(float $channel): float
    {
        return $channel <= 0.04045
            ? $channel / 12.92
            : (($channel + 0.055) / 1.055) ** 2.4;
    }

    private static function fromLinear(float $channel): float
    {
        return $channel <= 0.0031308
            ? $channel * 12.92
            : 1.055 * ($channel ** (1 / 2.4)) - 0.055;
    }
}
