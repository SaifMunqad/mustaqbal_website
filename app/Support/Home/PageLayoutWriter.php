<?php

namespace App\Support\Home;

use App\Enums\SectionType;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Support\Translation\TranslationPayload;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Stevebauman\Purify\Facades\Purify;

/**
 * Commits a whole page layout in one transaction across the normalized stores.
 *
 * For each submitted block it upserts the typed-column row, applies localized
 * text, re-syncs curated references (ordered) and replaces localized list rows
 * per (group, language), then removes any block dropped from the layout and
 * renumbers the display order to match the submitted array. maxInstances caps
 * are enforced server-side so the palette can never be trusted to have done it.
 *
 * Input is a plain, already-validated array (not a Request) so the writer is
 * reusable by any controller and trivially testable.
 */
class PageLayoutWriter
{
    /**
     * @param  list<array<string, mixed>>  $sections
     * @return list<int> the resulting section ids, in display order
     */
    public static function save(string $pageKey, array $sections, ?array $siteSettings = null): array
    {
        $page = Page::resolve($pageKey);
        $allowedCodes = collect(Language::activeList())->pluck('code')->all();

        self::assertWithinCaps($sections);

        $kept = [];

        DB::transaction(function () use ($pageKey, $page, $sections, $allowedCodes, &$kept): void {
            foreach (array_values($sections) as $index => $data) {
                $type = SectionType::from($data['section_type']);

                $section = ! empty($data['id'])
                    ? PageSection::query()->where('page_id', $page->id)->findOrFail($data['id'])
                    : new PageSection(['page_id' => $page->id]);

                // A page's palette is the source of truth for what may be
                // created there; existing blocks stay editable even if the
                // catalog later narrows.
                if ($section->exists === false && ! BlockRegistry::canUse($pageKey, $type)) {
                    throw ValidationException::withMessages([
                        'sections' => "The '{$type->label()}' block is not available on this page.",
                    ]);
                }

                $section->fill(self::columns($data, $index));
                $section->save();

                $kept[] = $section->id;

                self::applyTranslations($section, $data['translations'] ?? [], $allowedCodes, $type);

                if (in_array('items', $type->stores(), true)) {
                    self::syncItems($section, $type, $data['items'] ?? []);
                }

                if (in_array('list', $type->stores(), true)) {
                    self::replaceLists($section, $data['lists'] ?? [], $allowedCodes);
                }
            }

            $removal = PageSection::query()->where('page_id', $page->id);
            if ($kept !== []) {
                $removal->whereKeyNot($kept);
            }
            $removal->delete();
        });

        PageSections::flush($pageKey);

        return $kept;
    }

    /**
     * The typed-column attributes for a block, including the stamped order.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private static function columns(array $data, int $index): array
    {
        return [
            'section_type' => $data['section_type'],
            'zone' => $data['zone'] ?? 'main',
            'sort_order' => $index,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'image_path' => filled($data['image_path'] ?? null) ? $data['image_path'] : null,
            'cta_url' => filled($data['cta_url'] ?? null) ? $data['cta_url'] : null,
            'tone' => $data['tone'] ?? 'default',
            'columns' => ($data['columns'] ?? null) ?: null,
            'limit' => ($data['limit'] ?? null) ?: null,
            'span_lg' => ($data['span_lg'] ?? null) ?: null,
            'span_md' => ($data['span_md'] ?? null) ?: null,
            'span_sm' => ($data['span_sm'] ?? null) ?: null,
            'config' => filled($data['config'] ?? null) ? (array) $data['config'] : null,
        ];
    }

    /**
     * Persist localized scalars, dropping blank values so they fall back to the
     * default language instead of being written as empty rows.
     *
     * @param  array<string, array<string, mixed>>  $raw
     * @param  list<string>  $allowedCodes
     * @param  SectionType|null  $type  the block type, used for HTML sanitization
     */
    private static function applyTranslations(PageSection $section, array $raw, array $allowedCodes, ?SectionType $type = null): void
    {
        $fields = $section->translatedAttributes();
        $sanitize = $type === SectionType::RichText;
        $clean = [];

        foreach ($raw as $code => $values) {
            if (! is_array($values) || ! in_array((string) $code, $allowedCodes, true)) {
                continue;
            }

            foreach ($values as $field => $value) {
                if (! in_array((string) $field, $fields, true)) {
                    continue;
                }

                if ($value === null || (is_string($value) && trim($value) === '')) {
                    continue;
                }

                // Rich-text bodies are HTML; strip anything unsafe before it is
                // ever rendered with dangerouslySetInnerHTML.
                if ($sanitize && $field === 'body' && is_string($value)) {
                    $value = Purify::clean($value);
                }

                $clean[$code][$field] = $value;
            }

            if (isset($clean[$code]) && $clean[$code] === []) {
                unset($clean[$code]);
            }
        }

        // Rows for languages absent from this submission would otherwise linger
        // stale; clear the section's translations then rewrite the surviving set.
        $section->translations()->delete();
        TranslationPayload::apply($section->translations(), $clean);
    }

    /**
     * Replace a curated block's ordered references. All items share the type's
     * source model; the submitted array order becomes `sort_order`.
     *
     * @param  list<array<string, mixed>>  $items
     */
    private static function syncItems(PageSection $section, SectionType $type, array $items): void
    {
        $section->items()->delete();

        $itemType = $type->itemType();

        if ($itemType === null) {
            return;
        }

        foreach (array_values($items) as $order => $item) {
            $id = (int) (is_array($item) ? ($item['id'] ?? 0) : $item);

            if ($id <= 0) {
                continue;
            }

            $section->items()->create([
                'item_type' => is_array($item) ? ($item['type'] ?? $itemType) : $itemType,
                'item_id' => $id,
                'sort_order' => $order,
            ]);
        }
    }

    /**
     * Replace localized list rows per (group, language). A submitted group is
     * fully rewritten; untouched groups are left as-is. Empty rows are skipped.
     *
     * @param  array<string, array<string, list<array<string, mixed>>>>  $lists  group -> langCode|'' -> rows
     * @param  list<string>  $allowedCodes
     */
    private static function replaceLists(PageSection $section, array $lists, array $allowedCodes): void
    {
        $languageIds = Language::query()->whereIn('code', $allowedCodes)->pluck('id', 'code')->all();

        foreach ($lists as $group => $byLang) {
            if (! is_array($byLang)) {
                continue;
            }

            $section->listItems()->where('item_group', $group)->delete();

            foreach ($byLang as $code => $rows) {
                // '' or '*' means a shared, non-localized row (null language_id).
                $languageId = ($code === '' || $code === '*') ? null : ($languageIds[$code] ?? null);

                if ($code !== '' && $code !== '*' && $languageId === null) {
                    continue;
                }

                foreach (array_values((array) $rows) as $order => $row) {
                    $row = (array) $row;

                    $entry = [
                        'language_id' => $languageId,
                        'item_group' => $group,
                        'sort_order' => $order,
                        'value' => (string) ($row['value'] ?? ''),
                        'title' => (string) ($row['title'] ?? ''),
                        'description' => (string) ($row['description'] ?? ''),
                        'icon' => (string) ($row['icon'] ?? ''),
                        'image_path' => (string) ($row['image_path'] ?? ''),
                        'url' => (string) ($row['url'] ?? ''),
                    ];

                    // Never persist a fully-empty row.
                    if ($entry['value'] === '' && $entry['title'] === '' && $entry['description'] === '' && $entry['icon'] === '') {
                        continue;
                    }

                    $section->listItems()->create($entry);
                }
            }
        }
    }

    /**
     * Reject a layout that exceeds any block type's singleton/instance cap.
     *
     * @param  list<array<string, mixed>>  $sections
     */
    private static function assertWithinCaps(array $sections): void
    {
        $counts = [];

        foreach ($sections as $data) {
            $value = $data['section_type'] ?? null;

            if (! is_string($value)) {
                continue;
            }

            $counts[$value] = ($counts[$value] ?? 0) + 1;
        }

        foreach ($counts as $value => $count) {
            $type = SectionType::tryFrom($value);

            if ($type && ! BlockRegistry::canAddMore($type, $count - 1)) {
                throw ValidationException::withMessages([
                    'sections' => "Only {$type->maxInstances()} '{$type->label()}' block(s) are allowed on a page.",
                ]);
            }
        }
    }
}
