<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\HomeSectionType;
use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use App\Support\Home\HomeSections;
use App\Support\Rules\ImageLocation;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin portal for curating the public home page. Management/admin only, since
 * the layout is shown to every visitor.
 */
class DashboardHomeSectionController extends Controller
{
    /**
     * Localized text (section title + authored heading/body/cta label).
     *
     * @var list<string>
     */
    private const TRANSLATED = ['title', 'heading', 'body', 'cta_label'];

    public function index(): Response
    {
        $sections = HomeSection::query()
            ->with('translations.language')
            ->ordered()
            ->get()
            ->map(fn (HomeSection $section): array => [
                'id' => $section->id,
                'section_type' => $section->section_type->value,
                'type_label' => $section->section_type->label(),
                'kind' => $section->section_type->isCurated() ? 'curated' : 'authored',
                'title' => $section->translated('title'),
                'is_active' => $section->is_active,
                'item_count' => count($section->itemIds()),
                'heading' => $section->section_type->isAuthored()
                    ? $section->translated('heading')
                    : null,
            ]);

        return Inertia::render('dashboard/home-sections/index', [
            'sections' => $sections,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/home-sections/create', [
            'typeOptions' => HomeSectionType::options(),
            'availableItems' => $this->allAvailableItems(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate($this->rules());

        $section = HomeSection::query()->create([
            ...$this->prepare($request),
            'sort_order' => HomeSection::nextSortOrder(),
        ]);

        TranslationPayload::apply($section->translations(), $this->cleanedPayload($request));

        return redirect()
            ->route('dashboard.home-sections.index')
            ->with('success', 'Home section added.');
    }

    public function edit(HomeSection $homeSection): Response
    {
        $homeSection->load(['translations.language']);

        return Inertia::render('dashboard/home-sections/edit', [
            'section' => [
                'id' => $homeSection->id,
                'section_type' => $homeSection->section_type->value,
                'limit' => $homeSection->limit,
                'is_active' => $homeSection->is_active,
                'config' => $homeSection->config ?? [],
            ],
            'translations' => $this->existingTranslations($homeSection),
            'typeOptions' => HomeSectionType::options(),
            'availableItems' => $this->allAvailableItems(),
        ]);
    }

    public function update(Request $request, HomeSection $homeSection): RedirectResponse
    {
        $request->validate($this->rules());

        $homeSection->update($this->prepare($request));

        TranslationPayload::apply($homeSection->translations(), $this->cleanedPayload($request));

        return redirect()
            ->route('dashboard.home-sections.index')
            ->with('success', 'Home section updated.');
    }

    public function destroy(HomeSection $homeSection): RedirectResponse
    {
        $homeSection->delete();

        return redirect()
            ->route('dashboard.home-sections.index')
            ->with('success', 'Home section removed.');
    }

    /**
     * Persist a new display order sent by the portal's up/down controls.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['required', 'integer', Rule::exists('home_sections', 'id')],
        ]);

        foreach ($validated['order'] as $index => $id) {
            HomeSection::query()->whereKey($id)->update(['sort_order' => $index]);
        }

        return back()->with('success', 'Home page order saved.');
    }

    /**
     * @return array<string, list<array{id: int, label: string}>>
     */
    private function allAvailableItems(): array
    {
        $items = [];

        foreach (HomeSectionType::cases() as $type) {
            if ($type->isCurated()) {
                $items[$type->value] = HomeSections::availableItems($type);
            }
        }

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return array_merge([
            'section_type' => ['required', Rule::in(HomeSectionType::values())],
            'limit' => ['nullable', 'integer', 'min:1', 'max:12'],
            'is_active' => ['nullable', 'boolean'],
            'config' => ['nullable', 'array'],
            'config.item_ids' => ['nullable', 'array'],
            'config.item_ids.*' => ['integer'],
            'config.image_url' => ['nullable', new ImageLocation, 'max:2048'],
            'config.cta_url' => ['nullable', 'string', 'max:2048'],
            'config.tone' => ['nullable', Rule::in(['default', 'blue', 'green', 'amber', 'red'])],
        ], TranslationPayload::rules(self::TRANSLATED, [
            'title' => ['string', 'max:255'],
            'heading' => ['string', 'max:255'],
            'body' => ['string', 'max:5000'],
            'cta_label' => ['string', 'max:120'],
        ], []));
    }

    /**
     * Normalise the parent (non-localized) attributes for storage: coerce the
     * boolean, prune empty item ids and keep only the shared config keys.
     *
     * @return array<string, mixed>
     */
    private function prepare(Request $request): array
    {
        $config = Arr::only((array) $request->input('config', []), ['item_ids', 'image_url', 'cta_url', 'tone']);

        if (isset($config['item_ids'])) {
            $config['item_ids'] = array_values(array_filter(
                array_map('intval', (array) $config['item_ids']),
                static fn (int $id): bool => $id > 0,
            ));
        }

        $config = array_filter($config, static fn ($value): bool => $value !== null && $value !== '' && $value !== []);

        return [
            'section_type' => $request->input('section_type'),
            'limit' => $request->input('limit') ?: null,
            'is_active' => (bool) $request->input('is_active'),
            'config' => $config,
        ];
    }

    /**
     * The extracted translation payload, pruning empty strings so optional
     * localized fields left blank simply fall back to the default language.
     *
     * @return array<string, array<string, string>>
     */
    private function cleanedPayload(Request $request): array
    {
        $payload = TranslationPayload::extract($request, self::TRANSLATED);

        foreach ($payload as $code => $fields) {
            foreach ($fields as $field => $value) {
                if ($value === '' || $value === null) {
                    unset($payload[$code][$field]);
                }
            }

            if ($payload[$code] === []) {
                unset($payload[$code]);
            }
        }

        return $payload;
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function existingTranslations(HomeSection $section): array
    {
        return $section->translations
            ->filter(fn ($translation) => $translation->language)
            ->mapWithKeys(fn ($translation): array => [
                $translation->language->code => [
                    'title' => (string) $translation->title,
                    'heading' => (string) $translation->heading,
                    'body' => (string) $translation->body,
                    'cta_label' => (string) $translation->cta_label,
                ],
            ])
            ->all();
    }
}
