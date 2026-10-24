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
 * Mirrors the legacy Contact page into the normalized page builder.
 *
 * The current contact design is a page intro followed by the inquiry form, the
 * Site Settings contact column and the location map. This backfill turns that
 * composition into ordinary builder blocks so the page is fully editable.
 *
 * Seeder-only by design: it is never run from a migration or on boot, so an
 * unseeded installation keeps an empty contact builder and the public page
 * falls back to the legacy composition. Idempotent — it no-ops once the contact
 * page already has sections — and it never writes to the legacy tables.
 */
class ContactPageBackfill
{
    private const PAGE_KEY = 'contact';

    public static function run(): void
    {
        if (! Schema::hasTable('pages') || ! Schema::hasTable('page_sections')) {
            return;
        }

        $sitePage = SitePage::query()
            ->with(['translations.language'])
            ->where('slug', self::PAGE_KEY)
            ->first();

        if (! $sitePage) {
            return;
        }

        $page = Page::resolve(self::PAGE_KEY, 'Contact page');

        // Idempotency guard: the builder already owns this page.
        if (PageSection::query()->where('page_id', $page->id)->exists()) {
            return;
        }

        $order = 0;
        $order = self::intro($page->id, $sitePage, $order);

        // Match the legacy two-column row (form + contact column) on desktop by
        // giving the pair half-width spans; the map stays full width.
        self::section($page->id, SectionType::ContactForm, $order, ['span_lg' => 6]);
        self::section($page->id, SectionType::ContactDetails, $order + 1, ['span_lg' => 6]);
        self::section($page->id, SectionType::Map, $order + 2);

        PageSections::flush(self::PAGE_KEY);
    }

    public static function revert(): void
    {
        if (! Schema::hasTable('pages') || ! Schema::hasTable('page_sections')) {
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
     * The legacy intro band becomes the page hero (title + intro copy), the same
     * block the About page starts from.
     */
    private static function intro(int $pageId, SitePage $sitePage, int $order): int
    {
        $translations = [];

        foreach ($sitePage->translations as $translation) {
            $code = $translation->language?->code;

            if ($code === null) {
                continue;
            }

            $fields = array_filter(
                [
                    'heading' => (string) $translation->title,
                    'body' => (string) $translation->body,
                ],
                static fn (string $value): bool => trim($value) !== '',
            );

            if ($fields !== []) {
                $translations[$code] = $fields;
            }
        }

        if ($translations === []) {
            return $order;
        }

        $section = self::section($pageId, SectionType::Hero, $order, [
            'cta_url' => '/school/enroll',
        ]);

        self::translation($section, $translations);

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

            $section->translations()->create(['language_id' => $language->id] + $fields);
        }
    }
}
