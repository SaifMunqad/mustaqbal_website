<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\HomeSectionType;
use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use App\Models\Job;
use App\Models\Language;
use App\Models\Program;
use App\Models\SiteSetting;
use App\Support\Home\HomeSections;
use App\Support\Rules\ImageLocation;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
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

    /**
     * Localized Site Settings blocks the visual editor edits directly on the
     * home page: hero copy + the "why families" features and quick-stats lists.
     * Branding and footer stay owned by the dedicated Site Settings screen.
     *
     * @var list<string>
     */
    private const SITE_SCALARS = [
        'tagline',
        'home_title',
        'home_subtitle',
        'home_cta_primary',
        'home_cta_secondary',
    ];

    /**
     * @var list<string>
     */
    private const SITE_LISTS = ['home_stats', 'home_features'];

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
     * Visual, in-place home page editor. Renders the real layout and returns
     * every section as an editable "draft": the shared config plus the raw,
     * per-language translation rows (never the fallback-resolved text), so the
     * admin sees an un-authored language as blank instead of the default's text
     * and can't accidentally copy the fallback into another language. Includes
     * inactive sections so hidden blocks stay editable.
     */
    public function visual(): Response
    {
        // Live preview cards for curated sections (best-effort: only active
        // sections resolve to real content via the public render pass).
        $preview = collect(HomeSections::render())->keyBy('id');

        $drafts = HomeSection::query()
            ->with('translations.language')
            ->ordered()
            ->get()
            ->map(function (HomeSection $section) use ($preview): array {
                $type = $section->section_type;
                $config = $section->config ?? [];

                return [
                    'id' => $section->id,
                    'section_type' => $type->value,
                    'type_label' => $type->label(),
                    'label_key' => $type->labelKey(),
                    'kind' => $type->isCurated() ? 'curated' : 'authored',
                    'variant' => $type->variant(),
                    'is_active' => $section->is_active,
                    'limit' => $section->limit,
                    'config' => [
                        'item_ids' => $section->itemIds(),
                        'image_url' => $config['image_url'] ?? '',
                        'cta_url' => $config['cta_url'] ?? '',
                        'tone' => $config['tone'] ?? 'default',
                    ],
                    'translations' => $this->existingTranslations($section),
                    'preview_items' => $type->isCurated()
                        ? ($preview[$section->id]['items'] ?? [])
                        : [],
                ];
            })
            ->values()
            ->all();

        return Inertia::render('dashboard/home-sections/visual', [
            'sections' => $drafts,
            'typeOptions' => HomeSectionType::options(),
            'availableItems' => $this->allAvailableItems(),
            'site' => $this->siteDraft(),
            'preview' => $this->homePreview(),
        ]);
    }

    /**
     * Commit the whole staged layout in one transaction: create new sections,
     * update existing ones (config + per-language text), renumber the display
     * order to match the array, and remove any section dropped from the layout.
     */
    public function saveLayout(Request $request): RedirectResponse
    {
        $validated = $request->validate(array_merge([
            'sections' => ['present', 'array'],
            'sections.*.id' => ['nullable', 'integer', Rule::exists('home_sections', 'id')],
            'sections.*.section_type' => ['required', Rule::in(HomeSectionType::values())],
            'sections.*.is_active' => ['required', 'boolean'],
            'sections.*.limit' => ['nullable', 'integer', 'min:1', 'max:12'],
            'sections.*.config' => ['nullable', 'array'],
            'sections.*.config.item_ids' => ['nullable', 'array'],
            'sections.*.config.item_ids.*' => ['integer'],
            'sections.*.config.image_url' => ['nullable', new ImageLocation, 'max:2048'],
            'sections.*.config.cta_url' => ['nullable', 'string', 'max:2048'],
            'sections.*.config.tone' => ['nullable', Rule::in(['default', 'blue', 'green', 'amber', 'red'])],
            'sections.*.translations' => ['nullable', 'array'],
            'sections.*.translations.*' => ['array'],
            'sections.*.translations.*.*' => ['nullable', 'string', 'max:5000'],
        ], $this->siteRules()));

        $allowedCodes = collect(Language::activeList())->pluck('code')->all();
        $sections = $validated['sections'];
        $site = $validated['site'] ?? [];
        $kept = [];

        DB::transaction(function () use ($sections, $site, $allowedCodes, &$kept): void {
            foreach ($sections as $index => $data) {
                $fields = $this->normalizeFields($data, $index);

                $section = ! empty($data['id'])
                    ? HomeSection::query()->findOrFail($data['id'])
                    : HomeSection::query()->create($fields);

                if (! empty($data['id'])) {
                    $section->update($fields);
                }

                $kept[] = $section->id;

                $payload = $this->sanitizeTranslations($data['translations'] ?? [], $allowedCodes);
                TranslationPayload::apply($section->translations(), $payload);
            }

            $removal = HomeSection::query();
            if ($kept !== []) {
                $removal->whereKeyNot($kept);
            }
            $removal->delete();

            $this->applySiteDraft($site, $allowedCodes);
        });

        return back()->with('success', 'Home page saved.');
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
     * Normalise one submitted section into parent-row attributes, pruning empty
     * config values and stamping the display order from its array position.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeFields(array $data, int $index): array
    {
        $config = Arr::only((array) ($data['config'] ?? []), ['item_ids', 'image_url', 'cta_url', 'tone']);

        if (isset($config['item_ids'])) {
            $config['item_ids'] = array_values(array_filter(
                array_map('intval', (array) $config['item_ids']),
                static fn (int $id): bool => $id > 0,
            ));
        }

        $config = array_filter($config, static fn ($value): bool => $value !== null && $value !== '' && $value !== []);

        return [
            'section_type' => $data['section_type'],
            'limit' => ($data['limit'] ?? null) ?: null,
            'is_active' => (bool) ($data['is_active'] ?? false),
            'config' => $config,
            'sort_order' => $index,
        ];
    }

    /**
     * Keep only known languages and translatable fields, dropping blank values
     * so they fall back to the default language at read time rather than being
     * written as empty rows.
     *
     * @param  array<string, mixed>  $raw
     * @param  list<string>  $allowedCodes
     * @return array<string, array<string, string>>
     */
    private function sanitizeTranslations(array $raw, array $allowedCodes): array
    {
        $out = [];

        foreach ($raw as $code => $values) {
            if (! is_array($values) || ! in_array((string) $code, $allowedCodes, true)) {
                continue;
            }

            foreach ($values as $field => $value) {
                if (! in_array((string) $field, self::TRANSLATED, true)) {
                    continue;
                }

                // Drop blanks so they fall back to the default language instead of
                // writing an empty row. The ConvertEmptyStringsToNull middleware
                // turns a submitted empty/whitespace value into null.
                if ($value === null || (is_string($value) && trim($value) === '')) {
                    continue;
                }

                $out[$code][$field] = $value;
            }

            if (isset($out[$code]) && $out[$code] === []) {
                unset($out[$code]);
            }
        }

        return $out;
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

    /**
     * Validation rules for the Site Settings blocks edited on the home canvas
     * (hero copy + features/stats lists). The default language mirrors onto the
     * parent row; other languages persist as translation rows.
     *
     * @return array<string, mixed>
     */
    private function siteRules(): array
    {
        $rules = [
            'site' => ['nullable', 'array'],
            'site.hero_image' => ['nullable', new ImageLocation, 'max:2048'],
            'site.translations' => ['nullable', 'array'],
            'site.translations.*' => ['array'],
        ];

        foreach (self::SITE_SCALARS as $field) {
            $rules["site.translations.*.$field"] = ['nullable', 'string', 'max:2000'];
        }

        $rules['site.translations.*.home_stats'] = ['nullable', 'array'];
        $rules['site.translations.*.home_stats.*.value'] = ['nullable', 'string', 'max:60'];
        $rules['site.translations.*.home_stats.*.label'] = ['nullable', 'string', 'max:120'];
        $rules['site.translations.*.home_features'] = ['nullable', 'array'];
        $rules['site.translations.*.home_features.*.icon'] = ['nullable', 'string', 'max:40'];
        $rules['site.translations.*.home_features.*.title'] = ['nullable', 'string', 'max:120'];
        $rules['site.translations.*.home_features.*.description'] = ['nullable', 'string', 'max:500'];

        return $rules;
    }

    /**
     * The Site Settings blocks as a raw, per-language draft (fallback-free): the
     * default language reads its parent columns; other languages read only their
     * own rows, so an un-authored language shows blank rather than English.
     *
     * @return array{hero_image: string, translations: array<string, array<string, mixed>>}
     */
    private function siteDraft(): array
    {
        $setting = SiteSetting::current();
        $setting->load('translations.language');

        $default = Language::defaultCode();

        $rows = $setting->translations
            ->filter(fn ($translation) => $translation->language)
            ->keyBy(fn ($translation): string => $translation->language->code);

        $translations = [];

        foreach (collect(Language::activeList())->pluck('code')->all() as $code) {
            $source = $code === $default ? $setting : $rows->get($code);

            $entry = [];
            foreach (self::SITE_SCALARS as $field) {
                $entry[$field] = $source ? (string) ($source->{$field} ?? '') : '';
            }
            foreach (self::SITE_LISTS as $field) {
                $value = $source?->{$field} ?? [];
                $entry[$field] = is_array($value) ? $this->normalizeListForEditor($field, $value) : [];
            }

            $translations[$code] = $entry;
        }

        return [
            'hero_image' => (string) ($setting->home_hero_image ?? ''),
            'translations' => $translations,
        ];
    }

    /**
     * A small live sample of programs and jobs so the editor can preview the
     * auto home blocks. Degrades to empty when tables aren't ready.
     *
     * @return array{programs: array<int, array<string, mixed>>, jobs: array<int, array<string, mixed>>}
     */
    private function homePreview(): array
    {
        $locale = app()->getLocale();

        $programs = [];
        try {
            $programs = Program::query()
                ->with(['translations.language', 'typeTranslations.language'])
                ->orderBy('display_order')
                ->orderBy('id')
                ->limit(2)
                ->get()
                ->map(fn (Program $program): array => [
                    'id' => $program->id,
                    'name' => $program->translatedName($locale),
                    'program_type' => $program->program_type,
                    'program_type_label' => $program->translatedProgramType($locale),
                    'description' => $program->translatedDescription($locale),
                    'schedule' => $program->schedule,
                    'fees' => $program->fees,
                    'age_recommendation' => $program->age_recommendation,
                    'classroom_number' => $program->classroom_number,
                    'available_for_enroll' => $program->available_for_enroll,
                ])
                ->values()
                ->all();
        } catch (\Throwable) {
            $programs = [];
        }

        $jobs = [];
        try {
            $jobs = Job::query()
                ->with('translations.language')
                ->active()
                ->latest()
                ->limit(2)
                ->get()
                ->map(fn (Job $job): array => $job->toCard())
                ->values()
                ->all();
        } catch (\Throwable) {
            $jobs = [];
        }

        return ['programs' => $programs, 'jobs' => $jobs];
    }

    /**
     * Persist the Site Settings block draft. Only the submitted languages are
     * touched, so unedited languages are never clobbered.
     *
     * @param  array<string, mixed>  $site
     * @param  list<string>  $allowedCodes
     */
    private function applySiteDraft(array $site, array $allowedCodes): void
    {
        $setting = SiteSetting::resolved();
        $default = Language::defaultCode();

        if (array_key_exists('hero_image', $site)) {
            $setting->update(['home_hero_image' => $site['hero_image'] ?: null]);
        }

        $translations = (array) ($site['translations'] ?? []);
        $languages = Language::query()
            ->whereIn('code', array_keys($translations))
            ->get()
            ->keyBy('code');

        foreach ($translations as $code => $fields) {
            if (! is_array($fields) || ! in_array((string) $code, $allowedCodes, true)) {
                continue;
            }

            $clean = $this->cleanSiteFields($fields);

            if ($clean === []) {
                continue;
            }

            $language = $languages->get($code);

            if ($code === $default) {
                // The default language is the source of truth on the parent
                // columns. But a stale default-language translation row — the
                // seeder writes one for the default — shadows those columns on
                // the public read, because toShared()/translated() resolve a
                // translation row before falling back to the parent. Left as-is
                // the admin's saved home blocks never surface on the live page.
                // Mirror the write onto the default row so the parent (what the
                // editor shows) and the row (what the visitor reads) stay in
                // sync and edits appear immediately.
                $setting->update($clean);

                if ($language) {
                    $setting->translations()->updateOrCreate(['language_id' => $language->id], $clean);
                }
            } elseif ($language) {
                $setting->translations()->updateOrCreate(['language_id' => $language->id], $clean);
            }
        }
    }

    /**
     * Keep only the home-block Site Settings fields, coercing scalars to strings
     * and lists to cleaned arrays.
     *
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    private function cleanSiteFields(array $fields): array
    {
        $out = [];

        foreach (self::SITE_SCALARS as $field) {
            if (array_key_exists($field, $fields)) {
                $value = $fields[$field];
                $out[$field] = is_string($value) ? $value : (string) ($value ?? '');
            }
        }

        foreach (self::SITE_LISTS as $field) {
            if (array_key_exists($field, $fields)) {
                $out[$field] = $this->cleanSiteList($field, $fields[$field]);
            }
        }

        return $out;
    }

    /**
     * Shape list rows for storage and drop fully-empty ones so blank template
     * rows never render on the public home page.
     *
     * @return list<array<string, string>>
     */
    private function cleanSiteList(string $field, mixed $rows): array
    {
        if (! is_array($rows)) {
            return [];
        }

        return collect($rows)
            ->map(function (array $row) use ($field): array {
                $row = (array) $row;

                return $field === 'home_stats'
                    ? ['value' => (string) ($row['value'] ?? ''), 'label' => (string) ($row['label'] ?? '')]
                    : [
                        'icon' => (string) ($row['icon'] ?? ''),
                        'title' => (string) ($row['title'] ?? ''),
                        'description' => (string) ($row['description'] ?? ''),
                    ];
            })
            ->filter(function (array $row) use ($field): bool {
                if ($field === 'home_stats') {
                    return filled($row['value']) || filled($row['label']);
                }

                return filled($row['title']) || filled($row['description']);
            })
            ->values()
            ->all();
    }

    /**
     * Normalize stored list rows into the editor's expected {key: string} shape.
     *
     * @param  array<int, mixed>  $rows
     * @return list<array<string, string>>
     */
    private function normalizeListForEditor(string $field, array $rows): array
    {
        $keys = $field === 'home_stats' ? ['value', 'label'] : ['icon', 'title', 'description'];

        return collect($rows)
            ->map(function (mixed $row) use ($keys): array {
                $row = (array) $row;

                return array_combine(
                    $keys,
                    array_map(static fn (string $key): string => (string) ($row[$key] ?? ''), $keys),
                );
            })
            ->values()
            ->all();
    }
}
