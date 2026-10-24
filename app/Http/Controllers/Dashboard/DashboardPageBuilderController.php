<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\SectionType;
use App\Http\Controllers\Controller;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Support\Home\BlockRegistry;
use App\Support\Home\BuilderPages;
use App\Support\Home\PageLayoutWriter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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

    public function save(Request $request, string $page = 'home'): RedirectResponse
    {
        $pageKey = $this->pageKey($page);

        $validated = $request->validate([
            'sections' => ['present', 'array'],
            'sections.*.id' => ['nullable', 'integer', Rule::exists('page_sections', 'id')],
            'sections.*.section_type' => ['required', Rule::in(SectionType::values())],
            'sections.*.zone' => ['nullable', 'string', 'max:40'],
            'sections.*.is_active' => ['required', 'boolean'],
            'sections.*.limit' => ['nullable', 'integer', 'min:1', 'max:12'],
            'sections.*.columns' => ['nullable', 'integer', 'min:1', 'max:6'],
            'sections.*.image_path' => ['nullable', 'string', 'max:2048'],
            'sections.*.cta_url' => ['nullable', 'string', 'max:2048'],
            'sections.*.tone' => ['nullable', Rule::in(['default', 'blue', 'green', 'amber', 'red'])],
            'sections.*.span_lg' => ['nullable', 'integer', 'min:1', 'max:12'],
            'sections.*.span_md' => ['nullable', 'integer', 'min:1', 'max:12'],
            'sections.*.span_sm' => ['nullable', 'integer', 'min:1', 'max:12'],
            'sections.*.config' => ['nullable', 'array'],
            'sections.*.items' => ['nullable', 'array'],
            'sections.*.items.*.id' => ['required', 'integer', 'min:1'],
            'sections.*.items.*.type' => ['nullable', 'string', 'max:40'],
            'sections.*.lists' => ['nullable', 'array'],
            'sections.*.lists.*' => ['nullable', 'array'],
            'sections.*.lists.*.*' => ['array'],
            'sections.*.lists.*.*.*.value' => ['nullable', 'string', 'max:255'],
            'sections.*.lists.*.*.*.title' => ['nullable', 'string', 'max:255'],
            'sections.*.lists.*.*.*.description' => ['nullable', 'string', 'max:2000'],
            'sections.*.lists.*.*.*.icon' => ['nullable', 'string', 'max:60'],
            // Row media/link columns are part of the generic list store; without
            // explicit rules they would rely on the wildcard-array behaviour.
            'sections.*.lists.*.*.*.image_path' => ['nullable', 'string', 'max:2048'],
            'sections.*.lists.*.*.*.url' => ['nullable', 'string', 'max:2048'],
            'sections.*.translations' => ['nullable', 'array'],
            'sections.*.translations.*' => ['array'],
            'sections.*.translations.*.*' => ['nullable', 'string', 'max:5000'],
        ]);

        PageLayoutWriter::save($pageKey, $validated['sections']);

        return back()->with(
            'success',
            BuilderPages::label($pageKey).' saved.',
        );
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
