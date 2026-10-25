<?php

namespace App\Support\Translation;

/**
 * Curated catalog of the languages an admin can add from the dashboard.
 *
 * The language form no longer accepts free-text codes and names: the admin
 * searches this catalog, picks an entry, and the stored `code`, `name` and text
 * `dir` come from here. That keeps every row's code aligned with the shared
 * `fa_AF` / `ps` / `en` conventions the translation tables, typography
 * resolution and frontend locale bundles rely on.
 *
 * Entries are ordered Dari, Pashto and the other Arabic-script languages first
 * (the project's own audience), followed by the remaining catalog
 * alphabetically-ish by script/region so the picker opens on sensible options.
 */
final class LanguageCatalog
{
    /**
     * Catalog keyed by the language code stored in `languages.code`.
     *
     * `name` is the English label shown in the picker, `native` the endonym
     * shown beside it, and `dir` the text direction for the row.
     *
     * @var array<string, array{name: string, native: string, dir: string}>
     */
    private const LANGUAGES = [
        // ---------------------------------------------------------------
        // Arabic script — Dari, Pashto and neighbours
        // ---------------------------------------------------------------
        'fa_AF' => ['name' => 'Dari', 'native' => 'دری', 'dir' => 'rtl'],
        'ps' => ['name' => 'Pashto', 'native' => 'پښتو', 'dir' => 'rtl'],
        'ar' => ['name' => 'Arabic', 'native' => 'العربية', 'dir' => 'rtl'],
        'fa' => ['name' => 'Persian', 'native' => 'فارسی', 'dir' => 'rtl'],
        'ur' => ['name' => 'Urdu', 'native' => 'اردو', 'dir' => 'rtl'],
        'ku' => ['name' => 'Kurdish', 'native' => 'Kurdî', 'dir' => 'rtl'],
        'he' => ['name' => 'Hebrew', 'native' => 'עברית', 'dir' => 'rtl'],

        // ---------------------------------------------------------------
        // Central Asian and Turkic (Latin / Cyrillic)
        // ---------------------------------------------------------------
        'tg' => ['name' => 'Tajik', 'native' => 'Тоҷикӣ', 'dir' => 'ltr'],
        'uz' => ['name' => 'Uzbek', 'native' => 'Oʻzbekcha', 'dir' => 'ltr'],
        'tk' => ['name' => 'Turkmen', 'native' => 'Türkmençe', 'dir' => 'ltr'],
        'az' => ['name' => 'Azerbaijani', 'native' => 'Azərbaycanca', 'dir' => 'ltr'],
        'tr' => ['name' => 'Turkish', 'native' => 'Türkçe', 'dir' => 'ltr'],
        'kk' => ['name' => 'Kazakh', 'native' => 'Қазақша', 'dir' => 'ltr'],
        'ky' => ['name' => 'Kyrgyz', 'native' => 'Кыргызча', 'dir' => 'ltr'],

        // ---------------------------------------------------------------
        // European
        // ---------------------------------------------------------------
        'en' => ['name' => 'English', 'native' => 'English', 'dir' => 'ltr'],
        'fr' => ['name' => 'French', 'native' => 'Français', 'dir' => 'ltr'],
        'de' => ['name' => 'German', 'native' => 'Deutsch', 'dir' => 'ltr'],
        'es' => ['name' => 'Spanish', 'native' => 'Español', 'dir' => 'ltr'],
        'it' => ['name' => 'Italian', 'native' => 'Italiano', 'dir' => 'ltr'],
        'pt' => ['name' => 'Portuguese', 'native' => 'Português', 'dir' => 'ltr'],
        'nl' => ['name' => 'Dutch', 'native' => 'Nederlands', 'dir' => 'ltr'],
        'sv' => ['name' => 'Swedish', 'native' => 'Svenska', 'dir' => 'ltr'],
        'no' => ['name' => 'Norwegian', 'native' => 'Norsk', 'dir' => 'ltr'],
        'da' => ['name' => 'Danish', 'native' => 'Dansk', 'dir' => 'ltr'],
        'fi' => ['name' => 'Finnish', 'native' => 'Suomi', 'dir' => 'ltr'],
        'is' => ['name' => 'Icelandic', 'native' => 'Íslenska', 'dir' => 'ltr'],
        'pl' => ['name' => 'Polish', 'native' => 'Polski', 'dir' => 'ltr'],
        'cs' => ['name' => 'Czech', 'native' => 'Čeština', 'dir' => 'ltr'],
        'sk' => ['name' => 'Slovak', 'native' => 'Slovenčina', 'dir' => 'ltr'],
        'hu' => ['name' => 'Hungarian', 'native' => 'Magyar', 'dir' => 'ltr'],
        'ro' => ['name' => 'Romanian', 'native' => 'Română', 'dir' => 'ltr'],
        'bg' => ['name' => 'Bulgarian', 'native' => 'Български', 'dir' => 'ltr'],
        'sr' => ['name' => 'Serbian', 'native' => 'Српски', 'dir' => 'ltr'],
        'hr' => ['name' => 'Croatian', 'native' => 'Hrvatski', 'dir' => 'ltr'],
        'bs' => ['name' => 'Bosnian', 'native' => 'Bosanski', 'dir' => 'ltr'],
        'sl' => ['name' => 'Slovenian', 'native' => 'Slovenščina', 'dir' => 'ltr'],
        'mk' => ['name' => 'Macedonian', 'native' => 'Македонски', 'dir' => 'ltr'],
        'sq' => ['name' => 'Albanian', 'native' => 'Shqip', 'dir' => 'ltr'],
        'el' => ['name' => 'Greek', 'native' => 'Ελληνικά', 'dir' => 'ltr'],
        'ru' => ['name' => 'Russian', 'native' => 'Русский', 'dir' => 'ltr'],
        'uk' => ['name' => 'Ukrainian', 'native' => 'Українська', 'dir' => 'ltr'],
        'be' => ['name' => 'Belarusian', 'native' => 'Беларуская', 'dir' => 'ltr'],
        'lt' => ['name' => 'Lithuanian', 'native' => 'Lietuvių', 'dir' => 'ltr'],
        'lv' => ['name' => 'Latvian', 'native' => 'Latviešu', 'dir' => 'ltr'],
        'et' => ['name' => 'Estonian', 'native' => 'Eesti', 'dir' => 'ltr'],
        'hy' => ['name' => 'Armenian', 'native' => 'Հայերեն', 'dir' => 'ltr'],
        'ka' => ['name' => 'Georgian', 'native' => 'ქართული', 'dir' => 'ltr'],

        // ---------------------------------------------------------------
        // South and East Asian
        // ---------------------------------------------------------------
        'hi' => ['name' => 'Hindi', 'native' => 'हिन्दी', 'dir' => 'ltr'],
        'bn' => ['name' => 'Bengali', 'native' => 'বাংলা', 'dir' => 'ltr'],
        'ne' => ['name' => 'Nepali', 'native' => 'नेपाली', 'dir' => 'ltr'],
        'si' => ['name' => 'Sinhala', 'native' => 'සිංහල', 'dir' => 'ltr'],
        'ta' => ['name' => 'Tamil', 'native' => 'தமிழ்', 'dir' => 'ltr'],
        'id' => ['name' => 'Indonesian', 'native' => 'Bahasa Indonesia', 'dir' => 'ltr'],
        'ms' => ['name' => 'Malay', 'native' => 'Bahasa Melayu', 'dir' => 'ltr'],
        'th' => ['name' => 'Thai', 'native' => 'ไทย', 'dir' => 'ltr'],
        'vi' => ['name' => 'Vietnamese', 'native' => 'Tiếng Việt', 'dir' => 'ltr'],
        'zh' => ['name' => 'Chinese', 'native' => '中文', 'dir' => 'ltr'],
        'ja' => ['name' => 'Japanese', 'native' => '日本語', 'dir' => 'ltr'],
        'ko' => ['name' => 'Korean', 'native' => '한국어', 'dir' => 'ltr'],

        // ---------------------------------------------------------------
        // African
        // ---------------------------------------------------------------
        'sw' => ['name' => 'Swahili', 'native' => 'Kiswahili', 'dir' => 'ltr'],
        'am' => ['name' => 'Amharic', 'native' => 'አማርኛ', 'dir' => 'ltr'],
        'ha' => ['name' => 'Hausa', 'native' => 'Hausa', 'dir' => 'ltr'],
        'so' => ['name' => 'Somali', 'native' => 'Soomaali', 'dir' => 'ltr'],
    ];

    /**
     * Every catalog entry, in curated order, in the shape the dashboard picker
     * and the store action consume.
     *
     * @return list<array{code: string, name: string, native: string, dir: string}>
     */
    public static function options(): array
    {
        return array_map(
            static fn (string $code): array => ['code' => $code] + self::LANGUAGES[$code],
            array_keys(self::LANGUAGES),
        );
    }

    /**
     * The catalog entry for a code, or null when the code is not curated.
     *
     * @return array{code: string, name: string, native: string, dir: string}|null
     */
    public static function find(?string $code): ?array
    {
        if ($code === null || ! array_key_exists($code, self::LANGUAGES)) {
            return null;
        }

        return ['code' => $code] + self::LANGUAGES[$code];
    }

    /**
     * Catalog entries whose code is not already in `languages`, so the picker
     * never offers a duplicate.
     *
     * @param  list<string>  $takenCodes
     * @return list<array{code: string, name: string, native: string, dir: string}>
     */
    public static function available(array $takenCodes): array
    {
        return array_values(array_filter(
            self::options(),
            static fn (array $option): bool => ! in_array($option['code'], $takenCodes, true),
        ));
    }
}
