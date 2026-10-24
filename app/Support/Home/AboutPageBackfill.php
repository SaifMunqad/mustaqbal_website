<?php

namespace App\Support\Home;

use App\Enums\SectionType;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\SitePage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One-time, reversible backfill that moves the legacy About page (site_pages
 * content JSON + per-language translation rows) into the normalized page
 * builder.
 *
 * Idempotent — it no-ops once the About page already has builder sections — and
 * it never writes to the legacy tables, so the public fallback keeps working.
 * The mapping is intentionally lossless where the catalog allows it: the story
 * becomes a rich-text block, values become icon cards, and the leadership
 * message keeps its author image/role.
 */
class AboutPageBackfill
{
    private const PAGE_KEY = 'about';

    public static function run(): void
    {
        if (! Schema::hasTable('pages') || ! Schema::hasTable('page_sections')) {
            return;
        }

        $page = Page::resolve(self::PAGE_KEY, 'About page');

        // Idempotency guard: the builder already owns this page.
        if (PageSection::query()->where('page_id', $page->id)->exists()) {
            return;
        }

        $sitePage = SitePage::query()
            ->with(['translations.language'])
            ->where('slug', self::PAGE_KEY)
            ->first();

        if (! $sitePage) {
            return;
        }

        $shared = $sitePage->sharedContent();
        $default = Language::defaultCode();
        $languages = Language::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        // code => ['title' => ..., 'body' => ..., 'sections' => [...]]
        $localized = [];
        foreach ($languages as $language) {
            $row = $sitePage->translations->firstWhere('language_id', $language->id);
            $content = $language->code === $default
                ? $shared
                : (is_array($row?->content) ? $row->content : []);

            $localized[$language->code] = [
                'title' => (string) ($row?->title ?? ''),
                'body' => (string) ($row?->body ?? ''),
                'sections' => $content,
            ];
        }

        $order = 0;
        $order = self::hero($page->id, $sitePage, $localized, $order);
        $order = self::story($page->id, $localized, $order);
        $order = self::stats($page->id, $localized, $order);
        $order = self::values($page->id, $localized, $order);
        $order = self::highlights($page->id, $localized, $order);
        $order = self::message($page->id, $localized, $order);
        $order = self::simpleList($page->id, $localized, 'goals', 'Goals', $order);
        $order = self::simpleList($page->id, $localized, 'main_points', 'Main points', $order);
        $order = self::faq($page->id, $localized, $order);
        self::video($page->id, $shared, $order);

        PageSections::flush(self::PAGE_KEY);
    }

    public static function revert(): void
    {
        if (! Schema::hasTable('pages')) {
            return;
        }

        $pageId = DB::table('pages')->where('key', self::PAGE_KEY)->value('id');

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

        PageSections::flush(self::PAGE_KEY);
    }

    /**
     * @param  array<string, array{title: string, body: string, sections: array<string, mixed>}>  $localized
     */
    private static function hero(int $pageId, SitePage $sitePage, array $localized, int $order): int
    {
        $translations = [];
        foreach ($localized as $code => $entry) {
            $heading = $entry['title'];
            $body = (string) ($entry['sections']['intro'] ?? '');

            if ($heading === '' && $body === '') {
                continue;
            }

            $translations[$code] = ['heading' => $heading, 'body' => $body];
        }

        if ($translations === []) {
            return $order;
        }

        $section = self::section($pageId, SectionType::Hero, $order, [
            'image_path' => $sitePage->hero_image ?: null,
            'cta_url' => '/school/enroll',
            // The About hero's second button points at Contact; the home hero
            // keeps its built-in default when this is absent.
            'config' => ['cta_secondary_url' => '/school/contact'],
        ]);

        self::translation($section, $translations);

        return $order + 1;
    }

    /**
     * @param  array<string, array{title: string, body: string, sections: array<string, mixed>}>  $localized
     */
    private static function story(int $pageId, array $localized, int $order): int
    {
        $translations = [];
        foreach ($localized as $code => $entry) {
            if (trim($entry['body']) !== '') {
                $translations[$code] = ['body' => $entry['body']];
            }
        }

        if ($translations === []) {
            return $order;
        }

        $section = self::section($pageId, SectionType::RichText, $order);
        self::translation($section, $translations);

        return $order + 1;
    }

    /**
     * @param  array<string, array{title: string, body: string, sections: array<string, mixed>}>  $localized
     */
    private static function stats(int $pageId, array $localized, int $order): int
    {
        $rows = [];
        foreach ($localized as $code => $entry) {
            foreach ((array) ($entry['sections']['stats'] ?? []) as $stat) {
                $rows[$code][] = [
                    'value' => (string) ($stat['value'] ?? ''),
                    'title' => (string) ($stat['label'] ?? ''),
                ];
            }
        }

        if (self::empty($rows)) {
            return $order;
        }

        $section = self::section($pageId, SectionType::Stats, $order);
        self::listRows($section, 'stats', $rows);

        return $order + 1;
    }

    /**
     * @param  array<string, array{title: string, body: string, sections: array<string, mixed>}>  $localized
     */
    private static function values(int $pageId, array $localized, int $order): int
    {
        $rows = [];
        foreach ($localized as $code => $entry) {
            foreach ((array) ($entry['sections']['values'] ?? []) as $value) {
                $rows[$code][] = [
                    'title' => (string) ($value['title'] ?? ''),
                    'description' => (string) ($value['text'] ?? ''),
                    'icon' => (string) ($value['icon'] ?? ''),
                ];
            }
        }

        if (self::empty($rows)) {
            return $order;
        }

        $section = self::section($pageId, SectionType::IconCards, $order);
        self::listRows($section, 'features', $rows);

        return $order + 1;
    }

    /**
     * @param  array<string, array{title: string, body: string, sections: array<string, mixed>}>  $localized
     */
    private static function highlights(int $pageId, array $localized, int $order): int
    {
        $rows = [];
        foreach ($localized as $code => $entry) {
            foreach ((array) ($entry['sections']['highlights'] ?? []) as $highlight) {
                $rows[$code][] = [
                    'title' => (string) ($highlight['title'] ?? ''),
                    'description' => (string) ($highlight['text'] ?? ''),
                ];
            }
        }

        if (self::empty($rows)) {
            return $order;
        }

        $section = self::section($pageId, SectionType::Testimonials, $order);
        self::listRows($section, 'testimonials', $rows);

        return $order + 1;
    }

    /**
     * The leadership message keeps its author image, name, role and copy by
     * mapping onto the people-card list (image + title + value + description).
     *
     * @param  array<string, array{title: string, body: string, sections: array<string, mixed>}>  $localized
     */
    private static function message(int $pageId, array $localized, int $order): int
    {
        $rows = [];
        foreach ($localized as $code => $entry) {
            $message = (array) ($entry['sections']['message'] ?? []);

            if (trim((string) ($message['text'] ?? '')) === '') {
                continue;
            }

            $rows[$code][] = [
                'title' => (string) ($message['author_name'] ?? ''),
                'value' => (string) ($message['author_role'] ?? ''),
                'description' => (string) ($message['text'] ?? ''),
                'image_path' => (string) ($message['author_image'] ?? ''),
            ];
        }

        if (self::empty($rows)) {
            return $order;
        }

        $section = self::section($pageId, SectionType::Team, $order);
        self::listRows($section, 'team', $rows);

        return $order + 1;
    }

    /**
     * @param  array<string, array{title: string, body: string, sections: array<string, mixed>}>  $localized
     */
    private static function simpleList(int $pageId, array $localized, string $key, string $label, int $order): int
    {
        $rows = [];
        foreach ($localized as $code => $entry) {
            foreach ((array) ($entry['sections'][$key] ?? []) as $item) {
                $item = trim((string) $item);

                if ($item !== '') {
                    $rows[$code][] = ['title' => $item];
                }
            }
        }

        if (self::empty($rows)) {
            return $order;
        }

        $section = self::section($pageId, SectionType::Testimonials, $order, [
            'config' => ['source' => $key, 'label' => $label],
        ]);
        self::listRows($section, 'testimonials', $rows);

        return $order + 1;
    }

    /**
     * @param  array<string, array{title: string, body: string, sections: array<string, mixed>}>  $localized
     */
    private static function faq(int $pageId, array $localized, int $order): int
    {
        $rows = [];
        foreach ($localized as $code => $entry) {
            foreach ((array) ($entry['sections']['faq'] ?? []) as $faq) {
                $rows[$code][] = [
                    'title' => (string) ($faq['question'] ?? ''),
                    'description' => (string) ($faq['answer'] ?? ''),
                ];
            }
        }

        if (self::empty($rows)) {
            return $order;
        }

        $section = self::section($pageId, SectionType::Faqs, $order);
        self::listRows($section, 'faqs', $rows);

        return $order + 1;
    }

    /**
     * @param  array<string, mixed>  $shared
     */
    private static function video(int $pageId, array $shared, int $order): int
    {
        $src = self::videoSrc($shared['video_embed'] ?? null);

        if ($src === null) {
            return $order;
        }

        self::section($pageId, SectionType::VideoEmbed, $order, [
            'config' => ['video_url' => $src],
        ]);

        return $order + 1;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private static function section(int $pageId, SectionType $type, int $order, array $overrides = []): PageSection
    {
        return PageSection::query()->create([
            'page_id' => $pageId,
            'section_type' => $type,
            'zone' => 'main',
            'sort_order' => $order,
            'is_active' => true,
            'tone' => 'default',
        ] + $overrides);
    }

    /**
     * @param  array<string, array<string, string>>  $translations
     */
    private static function translation(PageSection $section, array $translations): void
    {
        $languages = Language::query()
            ->whereIn('code', array_keys($translations))
            ->get()
            ->keyBy('code');

        foreach ($translations as $code => $fields) {
            $language = $languages->get($code);

            if (! $language) {
                continue;
            }

            $clean = array_filter($fields, static fn (string $value): bool => trim($value) !== '');

            if ($clean === []) {
                continue;
            }

            $section->translations()->create(['language_id' => $language->id] + $clean);
        }
    }

    /**
     * @param  array<string, list<array<string, string>>>  $rowsByCode
     */
    private static function listRows(PageSection $section, string $group, array $rowsByCode): void
    {
        $languages = Language::query()
            ->whereIn('code', array_keys($rowsByCode))
            ->get()
            ->keyBy('code');

        foreach ($rowsByCode as $code => $rows) {
            $language = $languages->get($code);

            if (! $language) {
                continue;
            }

            foreach (array_values($rows) as $index => $row) {
                if (! array_filter($row, static fn (string $value): bool => trim($value) !== '')) {
                    continue;
                }

                $section->listItems()->create([
                    'language_id' => $language->id,
                    'item_group' => $group,
                    'sort_order' => $index,
                    'value' => (string) ($row['value'] ?? ''),
                    'title' => (string) ($row['title'] ?? ''),
                    'description' => (string) ($row['description'] ?? ''),
                    'icon' => (string) ($row['icon'] ?? ''),
                    'image_path' => (string) ($row['image_path'] ?? ''),
                ]);
            }
        }
    }

    /**
     * @param  array<string, list<array<string, string>>>  $rows
     */
    private static function empty(array $rows): bool
    {
        foreach ($rows as $list) {
            if ($list !== []) {
                return false;
            }
        }

        return true;
    }

    /**
     * Lift the embeddable URL out of a pasted iframe/URL, mirroring the legacy
     * About view's normalisation.
     */
    private static function videoSrc(mixed $embed): ?string
    {
        if (! is_string($embed) || trim($embed) === '') {
            return null;
        }

        $value = trim($embed);

        if (preg_match('/<iframe[^>]*\ssrc=["\']([^"\']+)["\']/i', $value, $matches)) {
            $value = trim($matches[1]);
        }

        return preg_match('#^https?://#i', $value) ? $value : null;
    }
}
