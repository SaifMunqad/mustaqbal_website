<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\SectionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\SavePageLayoutRequest;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Support\Home\BlockRegistry;
use App\Support\Home\BuilderPages;
use App\Support\Home\BuilderRevision;
use App\Support\Home\PageLayoutWriter;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin portal for the normalized page builder (home, about and contact).
 * Management only, since the layouts are shown to every visitor.
 *
 * Every builder page offers the same block catalog, so the editor is one
 * component driven entirely by the request's page key; {@see BuilderPages} owns
 * which keys exist and the chrome around each one.
 *
 * The editor works on a fallback-free draft: every block is sent with its raw,
 * per-language rows (never the resolved fallback) plus its ordered references
 * and localized list rows, so an un-authored language shows blank and can't be
 * accidentally clobbered with the default text. Saving commits the whole staged
 * layout in one transaction via {@see PageLayoutWriter}.
 */
class DashboardPageBuilderController extends Controller
{
    public function visual(string $page = 'home'): Response
    {
        $pageKey = $this->pageKey($page);
        $record = Page::resolve($pageKey, BuilderPages::label($pageKey));

        $sections = PageSection::query()
            ->where('page_id', $record->id)
            ->with([
                'translations.language',
                'items',
                'listItems.language',
            ])
            ->ordered()
            ->get()
            ->map(fn (PageSection $section): array => $this->draft($section))
            ->values()
            ->all();

        $availableItems = [];
        foreach (SectionType::cases() as $type) {
            if ($type->isCurated()) {
                $availableItems[$type->value] = BlockRegistry::availableItems($type);
            }
        }

        return Inertia::render(BuilderPages::inertiaComponent($pageKey), [
            'page' => [
                'key' => $pageKey,
                'label' => BuilderPages::label($pageKey),
                'label_key' => BuilderPages::labelKey($pageKey),
                'revision' => BuilderRevision::for($record->id),
                'save_url' => route("dashboard.pages.{$pageKey}.save"),
                'visual_url' => route("dashboard.pages.{$pageKey}"),
                'index_url' => BuilderPages::indexUrl($pageKey),
            ],
            'sections' => $sections,
            'palette' => BlockRegistry::palette(BlockRegistry::countsFor($record->id)),
            'categories' => SectionType::categories(),
            'availableItems' => $availableItems,
            'defaultLanguage' => Language::defaultCode(),
        ]);
    }

    public function save(SavePageLayoutRequest $request, string $page = 'home'): RedirectResponse
    {
        $pageKey = $this->pageKey($page);

        $validated = $request->validated();

        // Optimistic lock for programmatic writers: a caller that read the
        // layout first can send the revision it saw, and a stale revision means
        // someone else committed since then. The web editor never sends it,
        // leaving interactive saving exactly as forgiving as before.
        if (filled($validated['expected_revision'] ?? null)) {
            $current = BuilderRevision::for(Page::resolve($pageKey)->id);

            if ($validated['expected_revision'] !== $current) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'expected_revision' => "The layout changed since it was read (expected revision {$validated['expected_revision']}, current {$current}). Re-read it with GetPageLayout and re-apply the edit.",
                ]);
            }
        }

        // Reject payloads carrying codes the writer would silently skip
        // before anything is persisted.
        $this->assertKnownTranslationCodes($validated['sections']);

        PageLayoutWriter::save($pageKey, $validated['sections'], null, $request->boolean('remove_missing'));

        // A translated flash key rather than the English page label, so the toast
        // follows the admin's UI language.
        return back()->with('success', 'flash.pageSaved');
    }

    /**
     * Fail loudly on unknown translation language codes. The writer silently
     * skips codes outside the active set (and the web editor only ever sends
     * active codes), but a programmatic caller that guesses "fa" instead of
     * "fa_AF" would otherwise get a success response while its text vanished.
     *
     * @param  array<int, array<string, mixed>>  $sections
     */
    private function assertKnownTranslationCodes(array $sections): void
    {
        $codes = collect(Language::activeList())->pluck('code')->all();

        foreach ($sections as $index => $section) {
            foreach (array_keys($section['translations'] ?? []) as $code) {
                if (! in_array((string) $code, $codes, true)) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "sections.{$index}.translations" => "Unknown language code [{$code}]. Use one of the active codes: ".implode(', ', $codes).'.',
                    ]);
                }
            }
        }
    }

    /**
     * Keep the builder limited to the pages the routes expose; anything else is
     * a 404 rather than silently editing another page's layout.
     */
    private function pageKey(string $page): string
    {
        abort_unless(BuilderPages::has($page), 404);

        return $page;
    }

    /**
     * A single block as an editable, fallback-free draft.
     *
     * @return array<string, mixed>
     */
    private function draft(PageSection $section): array
    {
        $type = $section->section_type;

        // Seed every active language with blanks, then overlay authored rows, so
        // an un-authored language renders as empty rather than the fallback text.
        $translations = [];
        foreach (collect(Language::activeList())->pluck('code') as $code) {
            $translations[$code] = ['title' => '', 'heading' => '', 'body' => '', 'cta_label' => ''];
        }
        foreach ($section->translations as $translation) {
            if (! $translation->language) {
                continue;
            }
            $translations[$translation->language->code] = [
                'title' => (string) $translation->title,
                'heading' => (string) $translation->heading,
                'body' => (string) $translation->body,
                'cta_label' => (string) $translation->cta_label,
            ];
        }

        $items = $section->items
            ->map(fn ($item): array => ['id' => (int) $item->item_id, 'type' => $item->item_type])
            ->values()
            ->all();

        // group -> language code (or '' when shared) -> ordered rows
        $lists = [];
        foreach ($section->listItems as $row) {
            $code = $row->language?->code ?? '';
            $lists[$row->item_group][$code][] = [
                'value' => (string) $row->value,
                'title' => (string) $row->title,
                'description' => (string) $row->description,
                'icon' => (string) $row->icon,
                'image_path' => (string) $row->image_path,
                'url' => (string) $row->url,
            ];
        }

        return [
            'id' => $section->id,
            'section_type' => $type->value,
            'type_label' => $type->label(),
            'label_key' => $type->labelKey(),
            'kind' => $type->isCurated() ? 'curated' : 'authored',
            'component' => $type->component(),
            'zone' => $section->zone,
            'is_active' => $section->is_active,
            'limit' => $section->limit,
            'columns' => $section->columns,
            'image_path' => (string) $section->image_path,
            'cta_url' => (string) $section->cta_url,
            'tone' => $section->tone,
            'span_lg' => $section->span_lg,
            'span_md' => $section->span_md,
            'span_sm' => $section->span_sm,
            'config' => $section->config ?? [],
            'stores' => $type->stores(),
            'list_group' => $type->listGroup(),
            'translations' => $translations,
            'items' => $items,
            'lists' => $lists,
        ];
    }
}
