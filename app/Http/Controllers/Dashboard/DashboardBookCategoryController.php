<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreBookCategoryRequest;
use App\Http\Requests\Dashboard\UpdateBookCategoryRequest;
use App\Models\BookCategory;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardBookCategoryController extends Controller
{
    /**
     * @var list<string>
     */
    private array $translationLocales = ['ps', 'fa_AF', 'ar'];

    public function index(): Response
    {
        $categories = BookCategory::query()
            ->with('translations.language')
            ->withCount('books')
            ->orderBy('name')
            ->paginate(20)
            ->through(fn (BookCategory $category): array => [
                'id' => $category->id,
                'name' => $category->translatedName(),
                'slug' => $category->slug,
                'books_count' => $category->books_count,
            ]);

        return Inertia::render('dashboard/categories/dashboard-categories-index', [
            'categories' => $categories,
            'translationLocales' => $this->translationLocales,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/categories/dashboard-categories-create', [
            'translationLocales' => $this->translationLocales,
        ]);
    }

    public function store(StoreBookCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $category = BookCategory::query()->create([
            'name' => $validated['name'],
            'slug' => $this->uniqueSlug($validated['name']),
        ]);

        $this->syncTranslations($category, $request);

        return redirect()
            ->route('dashboard.categories.index')
            ->with('success', 'flash.categoryCreated');
    }

    public function edit(BookCategory $category): Response
    {
        $category->load(['translations.language']);

        return Inertia::render('dashboard/categories/dashboard-categories-edit', [
            // `name_translations` is presented to the flat-field editor as the
            // existing per-locale map, sourced from the translation rows.
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'name_translations' => $category->translations
                    ->mapWithKeys(fn ($translation): array => [
                        $translation->language?->code => (string) $translation->name,
                    ])
                    ->filter(fn ($value, $code): bool => filled($code))
                    ->all(),
            ],
            'translationLocales' => $this->translationLocales,
        ]);
    }

    public function update(UpdateBookCategoryRequest $request, BookCategory $category): RedirectResponse
    {
        $validated = $request->validated();

        $category->update(['name' => $validated['name']]);

        $this->syncTranslations($category, $request);

        return redirect()
            ->route('dashboard.categories.index')
            ->with('success', 'flash.categoryUpdated');
    }

    public function destroy(BookCategory $category): RedirectResponse
    {
        $category->delete();

        return redirect()
            ->route('dashboard.categories.index')
            ->with('success', 'flash.categoryDeleted');
    }

    /**
     * Persist the flat `name_{locale}` inputs into translation rows (the parent
     * `name` stays the default-language source of truth).
     */
    private function syncTranslations(BookCategory $category, Request $request): void
    {
        $payload = [];

        foreach ($this->translationLocales as $locale) {
            $value = $request->input("name_$locale");

            if (filled($value)) {
                $payload[$locale] = ['name' => trim((string) $value)];
            }
        }

        TranslationPayload::apply($category->translations(), $payload);
    }

    private function uniqueSlug(string $name): string
    {
        do {
            $slug = Str::slug($name).'-'.Str::lower(Str::random(4));
        } while (BookCategory::query()->where('slug', $slug)->exists());

        return $slug;
    }
}
