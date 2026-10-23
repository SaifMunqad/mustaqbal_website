<?php

namespace App\Support\Home;

use App\Models\Language;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Reversible backfill that migrates the legacy home page (home_sections + the
 * SiteSettings home blocks) into the normalized page builder.
 *
 * Idempotent — it no-ops once the home page already has sections — and it never
 * touches the legacy tables, so {@see revert()} simply removes the generated
 * builder rows and the old pipeline keeps working. Called both from its own
 * migration and re-runnable from tests/seeder.
 */
class PageBuilderBackfill
{
    public static function run(): void
    {
        if (! Schema::hasTable('page_sections') || ! Schema::hasTable('pages')) {
            return;
        }

        $pageId = self::ensureHomePage();

        // Idempotency guard: already migrated.
        if (DB::table('page_sections')->where('page_id', $pageId)->exists()) {
            return;
        }

        $order = 0;
        $order = self::siteSettings($pageId, $order);
        self::legacySections($pageId, $order);

        // The legacy home always rendered a programs highlight and a latest-jobs
        // rail (hardcoded components). Seed equivalent builder blocks so the
        // builder-rendered home keeps parity with the old layout.
        self::ensureDefaultRail($pageId, 'programs');
        self::ensureDefaultRail($pageId, 'jobs');
    }

    public static function revert(): void
    {
        if (! Schema::hasTable('pages')) {
            return;
        }

        $pageId = DB::table('pages')->where('key', 'home')->value('id');

        if ($pageId === null) {
            return;
        }

        $sectionIds = DB::table('page_sections')->where('page_id', $pageId)->pluck('id')->all();

        if ($sectionIds !== []) {
            DB::table('section_items')->whereIn('page_section_id', $sectionIds)->delete();
            DB::table('section_list_items')->whereIn('page_section_id', $sectionIds)->delete();
            DB::table('page_section_translations')->whereIn('page_section_id', $sectionIds)->delete();
        }

        DB::table('page_sections')->where('page_id', $pageId)->delete();
    }

    private static function ensureHomePage(): int
    {
        $existing = DB::table('pages')->where('key', 'home')->value('id');

        if ($existing !== null) {
            return (int) $existing;
        }

        $now = now();

        return (int) DB::table('pages')->insertGetId([
            'key' => 'home',
            'label' => 'Home',
            'is_active' => true,
            'default_zone' => 'main',
            'created_at' => $now,
            'updated_at' => $now,
        ], 'id');
    }

    /**
     * Turn the SiteSettings home blocks (hero copy + feature/stat lists) into
     * builder blocks. Returns the next sort order.
     */
    private static function siteSettings(int $pageId, int $order): int
    {
        if (! Schema::hasTable('site_settings')) {
            return $order;
        }

        $row = DB::table('site_settings')->orderBy('id')->first();

        if ($row === null) {
            return $order;
        }

        $default = Language::defaultCode();
        $languages = DB::table('languages')->get()->keyBy('id');
        $codeById = $languages->pluck('code', 'id')->all();

        $settingRows = collect(DB::table('site_setting_translations')
            ->where('site_setting_id', $row->id)
            ->get())
            ->keyBy('language_id');

        $valueFor = function (string $field, int $langId) use ($row, $settingRows, $codeById, $default): ?string {
            $code = $codeById[$langId] ?? null;
            $tr = $settingRows->get($langId);
            $translationValue = $tr ? ($tr->{$field} ?? null) : null;

            if ($code === $default) {
                return $row->{$field} ?? $translationValue;
            }

            return filled($translationValue) ? $translationValue : null;
        };

        // --- Hero block ---
        $heroId = self::insertSection($pageId, 'hero', $order++, [
            'image_path' => $row->home_hero_image ?: null,
        ]);

        foreach ($languages as $langId => $language) {
            $heading = $valueFor('home_title', (int) $langId);
            $body = $valueFor('home_subtitle', (int) $langId);
            $ctaLabel = $valueFor('home_cta_primary', (int) $langId);
            $tagline = $valueFor('tagline', (int) $langId);
            $ctaSecondary = $valueFor('home_cta_secondary', (int) $langId);

            if (! filled($heading) && ! filled($body)) {
                continue;
            }

            self::insertTranslation($heroId, (int) $langId, [
                'heading' => $heading,
                'body' => $body,
                'cta_label' => $ctaLabel,
            ]);

            if (filled($tagline) || filled($ctaSecondary)) {
                DB::table('page_sections')
                    ->where('id', $heroId)
                    ->update(['config' => json_encode(array_filter([
                        'tagline' => $tagline,
                        'cta_secondary' => $ctaSecondary,
                    ], static fn ($v): bool => filled($v)))]);
            }
        }

        // --- Features block ---
        $featuresId = null;
        foreach ($languages as $langId => $language) {
            $items = self::listFor($row, $settingRows, (int) $langId, 'home_features', $codeById, $default);

            if ($items === []) {
                continue;
            }

            $featuresId ??= self::insertSection($pageId, 'features', $order++, []);

            foreach ($items as $index => $item) {
                self::insertListItem($featuresId, $langId, 'features', $index, [
                    'title' => $item['title'] ?? null,
                    'description' => $item['description'] ?? null,
                    'icon' => $item['icon'] ?? null,
                ], true);
            }
        }

        // --- Stats block ---
        $statsId = null;
        foreach ($languages as $langId => $language) {
            $items = self::listFor($row, $settingRows, (int) $langId, 'home_stats', $codeById, $default);

            if ($items === []) {
                continue;
            }

            $statsId ??= self::insertSection($pageId, 'stats', $order++, []);

            foreach ($items as $index => $item) {
                self::insertListItem($statsId, $langId, 'stats', $index, [
                    'value' => $item['value'] ?? null,
                    'title' => $item['label'] ?? null,
                ], false);
            }
        }

        return $order;
    }

    /**
     * Migrate legacy home_sections rows onto builder blocks, appended after the
     * SiteSettings-derived blocks in their original display order.
     */
    private static function legacySections(int $pageId, int $order): void
    {
        if (! Schema::hasTable('home_sections')) {
            return;
        }

        $itemTypes = ['articles' => 'article', 'events' => 'event', 'recognition' => 'post'];
        $sections = DB::table('home_sections')->orderBy('sort_order')->orderBy('id')->get();

        foreach ($sections as $legacy) {
            $config = json_decode((string) ($legacy->config ?? ''), true) ?: [];

            $sectionId = self::insertSection($pageId, $legacy->section_type, $order++, [
                'image_path' => $config['image_url'] ?? null,
                'cta_url' => $config['cta_url'] ?? null,
                'tone' => $config['tone'] ?? 'default',
                'limit' => $legacy->limit ?: null,
            ]);

            if (isset($itemTypes[$legacy->section_type]) && ! empty($config['item_ids'])) {
                foreach (array_values((array) $config['item_ids']) as $index => $itemId) {
                    $itemId = (int) $itemId;

                    if ($itemId <= 0) {
                        continue;
                    }

                    DB::table('section_items')->insert([
                        'page_section_id' => $sectionId,
                        'item_type' => $itemTypes[$legacy->section_type],
                        'item_id' => $itemId,
                        'sort_order' => $index,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            if (Schema::hasTable('home_section_translations')) {
                $rows = DB::table('home_section_translations')->where('home_section_id', $legacy->id)->get();

                foreach ($rows as $tr) {
                    self::insertTranslation($sectionId, (int) $tr->language_id, [
                        'title' => $tr->title,
                        'heading' => $tr->heading,
                        'body' => $tr->body,
                        'cta_label' => $tr->cta_label,
                    ]);
                }
            }
        }
    }

    /**
     * The resolved list (features/stats) for one language, defaulting to the
     * parent JSON and reading an authored translation row for other languages.
     *
     * @return array<int, array<string, mixed>>
     */
    private static function listFor(object $row, $settingRows, int $langId, string $field, array $codeById, string $default): array
    {
        $tr = $settingRows->get($langId);
        $code = $codeById[$langId] ?? null;

        if ($tr && filled($tr->{$field})) {
            $decoded = is_string($tr->{$field}) ? json_decode($tr->{$field}, true) : $tr->{$field};

            return is_array($decoded) ? $decoded : [];
        }

        if ($code === $default) {
            $raw = $row->{$field} ?? null;
            $decoded = is_string($raw) ? json_decode($raw, true) : $raw;

            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    /**
     * Append a curated default rail (programs/jobs) when the page doesn't have
     * one yet, showing the latest two items by default.
     */
    private static function ensureDefaultRail(int $pageId, string $type): void
    {
        $exists = DB::table('page_sections')
            ->where('page_id', $pageId)
            ->where('section_type', $type)
            ->exists();

        if ($exists) {
            return;
        }

        $next = ((int) DB::table('page_sections')->where('page_id', $pageId)->max('sort_order')) + 1;

        self::insertSection($pageId, $type, $next, ['limit' => 2]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private static function insertSection(int $pageId, string $type, int $order, array $overrides): int
    {
        $now = now();

        return (int) DB::table('page_sections')->insertGetId([
            'page_id' => $pageId,
            'section_type' => $type,
            'zone' => 'main',
            'sort_order' => $order,
            'is_active' => true,
            'tone' => 'default',
            'created_at' => $now,
            'updated_at' => $now,
        ] + $overrides, 'id');
    }

    /**
     * @param  array<string, string|null>  $fields
     */
    private static function insertTranslation(int $sectionId, int $languageId, array $fields): void
    {
        $clean = array_filter($fields, static fn ($v): bool => filled($v));

        if ($clean === []) {
            return;
        }

        $now = now();

        DB::table('page_section_translations')->insert([
            'page_section_id' => $sectionId,
            'language_id' => $languageId,
            ...$clean,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * @param  array<string, string|null>  $fields
     */
    private static function insertListItem(int $sectionId, int|string $languageId, string $group, int $order, array $fields, bool $isFeature): void
    {
        $now = now();

        DB::table('section_list_items')->insert([
            'page_section_id' => $sectionId,
            'language_id' => (int) $languageId,
            'item_group' => $group,
            'sort_order' => $order,
            'title' => $fields['title'] ?? null,
            'value' => $fields['value'] ?? null,
            'description' => $isFeature ? ($fields['description'] ?? null) : null,
            'icon' => $isFeature ? ($fields['icon'] ?? null) : null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
}
