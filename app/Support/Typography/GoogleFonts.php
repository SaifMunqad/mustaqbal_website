<?php

namespace App\Support\Typography;

/**
 * Curated Google Fonts offered as ready-made typefaces next to the uploaded
 * families.
 *
 * These families are free to use (SIL Open Font License / Apache 2.0) but are
 * *not* bundled: the public page links the Google Fonts stylesheet for the
 * language that selects one.
 *
 * The catalog is ordered Arabic-script families first. `arabic` marks whether a
 * family ships Arabic glyphs — the Latin-only ones render Dari/Pashto/Arabic
 * text through the self-hosted Noto Naskh Arabic fallback instead of showing
 * tofu, and the dashboard warns about that per language.
 */
final class GoogleFonts
{
    /**
     * Ordered catalog. Weights are the ones requested from the stylesheet; all
     * of them are published for the family.
     *
     * @var array<string, array{name: string, weights: list<int>, arabic: bool}>
     */
    private const FONTS = [
        // ---------------------------------------------------------------
        // Arabic script (Dari, Pashto, Arabic)
        // ---------------------------------------------------------------
        'noto-naskh-arabic' => ['name' => 'Noto Naskh Arabic', 'weights' => [400, 500, 700], 'arabic' => true],
        'noto-kufi-arabic' => ['name' => 'Noto Kufi Arabic', 'weights' => [400, 500, 700], 'arabic' => true],
        'noto-sans-arabic' => ['name' => 'Noto Sans Arabic', 'weights' => [400, 500, 700], 'arabic' => true],
        'cairo' => ['name' => 'Cairo', 'weights' => [400, 600, 700], 'arabic' => true],
        'tajawal' => ['name' => 'Tajawal', 'weights' => [400, 500, 700], 'arabic' => true],
        'almarai' => ['name' => 'Almarai', 'weights' => [400, 700], 'arabic' => true],
        'changa' => ['name' => 'Changa', 'weights' => [400, 600, 700], 'arabic' => true],
        'el-messiri' => ['name' => 'El Messiri', 'weights' => [400, 600, 700], 'arabic' => true],
        'readex-pro' => ['name' => 'Readex Pro', 'weights' => [400, 500, 700], 'arabic' => true],
        'ibm-plex-sans-arabic' => ['name' => 'IBM Plex Sans Arabic', 'weights' => [400, 500, 700], 'arabic' => true],
        'amiri' => ['name' => 'Amiri', 'weights' => [400, 700], 'arabic' => true],
        'markazi-text' => ['name' => 'Markazi Text', 'weights' => [400, 600, 700], 'arabic' => true],
        'reem-kufi' => ['name' => 'Reem Kufi', 'weights' => [400, 500, 700], 'arabic' => true],
        'rubik' => ['name' => 'Rubik', 'weights' => [400, 500, 700], 'arabic' => true],

        // ---------------------------------------------------------------
        // Latin only (Arabic text falls back to Noto Naskh Arabic)
        // ---------------------------------------------------------------
        'roboto' => ['name' => 'Roboto', 'weights' => [400, 500, 700], 'arabic' => false],
        'open-sans' => ['name' => 'Open Sans', 'weights' => [400, 600, 700], 'arabic' => false],
        'montserrat' => ['name' => 'Montserrat', 'weights' => [400, 600, 700], 'arabic' => false],
        'lato' => ['name' => 'Lato', 'weights' => [400, 700], 'arabic' => false],
        'poppins' => ['name' => 'Poppins', 'weights' => [400, 500, 700], 'arabic' => false],
        'playfair-display' => ['name' => 'Playfair Display', 'weights' => [400, 600, 700], 'arabic' => false],
        'inter' => ['name' => 'Inter', 'weights' => [400, 500, 700], 'arabic' => false],
        'lora' => ['name' => 'Lora', 'weights' => [400, 500, 700], 'arabic' => false],
        'ibm-plex-sans' => ['name' => 'IBM Plex Sans', 'weights' => [400, 500, 700], 'arabic' => false],
    ];

    /** Fallback tail shared with the uploaded families, so scripts the Google
     *  family does not cover keep rendering from the self-hosted Noto Naskh. */
    private const FALLBACKS = "'Noto Naskh Arabic', 'Carlito', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_keys(self::FONTS);
    }

    public static function has(?string $key): bool
    {
        return $key !== null && array_key_exists($key, self::FONTS);
    }

    public static function name(string $key): string
    {
        return self::FONTS[$key]['name'];
    }

    public static function supportsArabic(string $key): bool
    {
        return self::FONTS[$key]['arabic'];
    }

    public static function stack(string $key): string
    {
        return "'".self::FONTS[$key]['name']."', ".self::FALLBACKS;
    }

    /**
     * Stylesheet URL for one family — used by the public page, so a visitor only
     * downloads the fonts the active language actually uses.
     */
    public static function href(string $key): string
    {
        return self::baseUrl().self::familyQuery($key).'&display=swap';
    }

    /**
     * One combined stylesheet for every family — used by the dashboard so the
     * typography previews and the gallery can render without a request per font.
     *
     * Only the regular weight is requested here: the previews and the gallery
     * render a single weight, and pulling three per family would dwarf the page.
     */
    public static function previewHref(): string
    {
        $families = array_map(
            static fn (string $key): string => self::familyQuery($key, [400]),
            self::keys(),
        );

        return self::baseUrl().implode('&', $families).'&display=swap';
    }

    /**
     * Catalog entry in the shape the frontend and the language resolver expect.
     *
     * @return array{source: string, family: string, stack: string, faces: list<array{weight: int, style: string, url: string, format: string}>, href: string}
     */
    public static function typography(string $key): array
    {
        return [
            'source' => 'google',
            'family' => self::name($key),
            'stack' => self::stack($key),
            'faces' => [],
            'href' => self::href($key),
        ];
    }

    /**
     * List for the dashboard picker and gallery, Arabic-script families first.
     *
     * @return list<array{key: string, name: string, stack: string, arabic: bool, href: string}>
     */
    public static function options(): array
    {
        return array_map(
            static fn (string $key): array => [
                'key' => $key,
                'name' => self::name($key),
                'stack' => self::stack($key),
                'arabic' => self::supportsArabic($key),
                'href' => self::href($key),
            ],
            self::keys(),
        );
    }

    private static function baseUrl(): string
    {
        return 'https://fonts.googleapis.com/css2?';
    }

    /**
     * @param  list<int>|null  $weights  defaults to the family's published set
     */
    private static function familyQuery(string $key, ?array $weights = null): string
    {
        $font = self::FONTS[$key];
        $family = str_replace('%20', '+', rawurlencode($font['name']));

        return 'family='.$family.':wght@'.implode(';', $weights ?? $font['weights']);
    }
}
