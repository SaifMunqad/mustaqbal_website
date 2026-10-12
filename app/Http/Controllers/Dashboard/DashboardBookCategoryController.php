<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\BookCategory;
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
            ->withCount('books')
            ->orderBy('name')
            ->paginate(20)
            ->through(fn (BookCategory $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'books_count' => $category->books_count,
            ]);

        return Inertia::render('dashboard/categories/index', [
            'categories' => $categories,
            'translationLocales' => $this->translationLocales,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/categories/create', [
            'translationLocales' => $this->translationLocales,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateCategory($request);

        BookCategory::query()->create([
            'name' => $validated['name'],
            'slug' => $this->uniqueSlug($validated['name']),
            'name_translations' => $this->buildTranslations($request),
        ]);

        return redirect()
            ->route('dashboard.categories.index')
            ->with('success', 'Category created.');
    }

    public function edit(BookCategory $category): Response
    {
        return Inertia::render('dashboard/categories/edit', [
            'category' => $category,
            'translationLocales' => $this->translationLocales,
        ]);
    }

    public function update(Request $request, BookCategory $category): RedirectResponse
    {
        $validated = $this->validateCategory($request);

        $category->update([
            'name' => $validated['name'],
            'name_translations' => $this->buildTranslations($request),
        ]);

        return redirect()
            ->route('dashboard.categories.index')
            ->with('success', 'Category updated.');
    }

    public function destroy(BookCategory $category): RedirectResponse
    {
        $category->delete();

        return redirect()
            ->route('dashboard.categories.index')
            ->with('success', 'Category deleted. Books in it are kept but uncategorized.');
    }

    private function validateCategory(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function buildTranslations(Request $request): array
    {
        $translations = [];

        foreach ($this->translationLocales as $locale) {
            $value = $request->input("name_$locale");

            if (filled($value)) {
                $translations[$locale] = trim((string) $value);
            }
        }

        return $translations;
    }

    private function uniqueSlug(string $name): string
    {
        do {
            $slug = Str::slug($name).'-'.Str::lower(Str::random(4));
        } while (BookCategory::query()->where('slug', $slug)->exists());

        return $slug;
    }
}
