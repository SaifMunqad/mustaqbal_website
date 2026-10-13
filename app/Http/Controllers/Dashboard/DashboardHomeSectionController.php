<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\HomeSectionType;
use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use App\Support\Home\HomeSections;
use App\Support\Rules\ImageLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin portal for curating the public home page. Management/admin only, since
 * the layout is shown to every visitor.
 */
class DashboardHomeSectionController extends Controller
{
    public function index(): Response
    {
        $sections = HomeSection::query()
            ->ordered()
            ->get()
            ->map(fn (HomeSection $section): array => [
                'id' => $section->id,
                'section_type' => $section->section_type->value,
                'type_label' => $section->section_type->label(),
                'kind' => $section->section_type->isCurated() ? 'curated' : 'authored',
                'title' => $section->title,
                'is_active' => $section->is_active,
                'item_count' => count($section->itemIds()),
                'heading' => $section->section_type->isAuthored()
                    ? ($section->config['heading'] ?? null)
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
        $validated = $this->validateSection($request);

        HomeSection::query()->create([
            ...$this->prepare($validated),
            'sort_order' => HomeSection::nextSortOrder(),
        ]);

        return redirect()
            ->route('dashboard.home-sections.index')
            ->with('success', 'Home section added.');
    }

    public function edit(HomeSection $homeSection): Response
    {
        return Inertia::render('dashboard/home-sections/edit', [
            'section' => [
                'id' => $homeSection->id,
                'section_type' => $homeSection->section_type->value,
                'title' => $homeSection->title,
                'limit' => $homeSection->limit,
                'is_active' => $homeSection->is_active,
                'config' => $homeSection->config ?? [],
            ],
            'typeOptions' => HomeSectionType::options(),
            'availableItems' => $this->allAvailableItems(),
        ]);
    }

    public function update(Request $request, HomeSection $homeSection): RedirectResponse
    {
        $validated = $this->validateSection($request);

        $homeSection->update($this->prepare($validated));

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
    private function validateSection(Request $request): array
    {
        return $request->validate([
            'section_type' => ['required', Rule::in(HomeSectionType::values())],
            'title' => ['nullable', 'string', 'max:255'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:12'],
            'is_active' => ['nullable', 'boolean'],
            'config' => ['nullable', 'array'],
            'config.item_ids' => ['nullable', 'array'],
            'config.item_ids.*' => ['integer'],
            'config.heading' => ['nullable', 'string', 'max:255'],
            'config.body' => ['nullable', 'string', 'max:5000'],
            'config.image_url' => ['nullable', new ImageLocation, 'max:2048'],
            'config.cta_label' => ['nullable', 'string', 'max:120'],
            'config.cta_url' => ['nullable', 'string', 'max:2048'],
            'config.tone' => ['nullable', Rule::in(['default', 'blue', 'green', 'amber', 'red'])],
        ]);
    }

    /**
     * Normalise validation output for storage: coerce booleans, prune empty
     * item ids and drop null config keys so the JSON stays tidy.
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function prepare(array $validated): array
    {
        $config = $validated['config'] ?? [];

        if (isset($config['item_ids'])) {
            $config['item_ids'] = array_values(array_filter(
                array_map('intval', (array) $config['item_ids']),
                static fn (int $id): bool => $id > 0,
            ));
        }

        $config = array_filter($config, static fn ($value): bool => $value !== null && $value !== '' && $value !== []);

        return [
            'section_type' => $validated['section_type'],
            'title' => $validated['title'] ?? null,
            'limit' => $validated['limit'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? false),
            'config' => $config,
        ];
    }
}
