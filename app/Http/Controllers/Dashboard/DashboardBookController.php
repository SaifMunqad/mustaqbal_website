<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardBookController extends Controller
{
    public function index(Request $request): Response
    {
        $books = Book::query()
            ->with('category:id,name')
            ->search($request->string('search')->toString())
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Book $book): array => [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'price_afn' => (float) $book->price_afn,
                'stock' => $book->stock,
                'is_available' => $book->is_available,
                'category' => $book->category?->name,
            ]);

        return Inertia::render('dashboard/books/index', [
            'books' => $books,
            'filters' => ['search' => $request->string('search')->toString()],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/books/create', [
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateBook($request);

        Book::query()->create([
            ...$validated,
            'slug' => $this->uniqueSlug($validated['title']),
            'images' => $this->cleanImages($validated['images'] ?? []),
            'is_available' => (bool) ($validated['is_available'] ?? false),
        ]);

        return redirect()
            ->route('dashboard.books.index')
            ->with('success', 'Book created.');
    }

    public function edit(Book $book): Response
    {
        return Inertia::render('dashboard/books/edit', [
            'book' => $book,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(Request $request, Book $book): RedirectResponse
    {
        $validated = $this->validateBook($request);

        $book->update([
            ...$validated,
            'images' => $this->cleanImages($validated['images'] ?? []),
            'is_available' => (bool) ($validated['is_available'] ?? false),
        ]);

        return redirect()
            ->route('dashboard.books.index')
            ->with('success', 'Book updated.');
    }

    public function destroy(Book $book): RedirectResponse
    {
        $book->delete();

        return redirect()
            ->route('dashboard.books.index')
            ->with('success', 'Book deleted.');
    }

    private function validateBook(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:64'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price_afn' => ['required', 'numeric', 'min:0', 'max:9999999'],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'cover_image' => ['nullable', 'url', 'max:2048'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', 'url', 'max:2048'],
            'book_category_id' => ['nullable', 'exists:book_categories,id'],
            'is_available' => ['nullable', 'boolean'],
        ]);
    }

    private function uniqueSlug(string $title): string
    {
        do {
            $slug = Str::slug($title).'-'.Str::lower(Str::random(4));
        } while (Book::query()->where('slug', $slug)->exists());

        return $slug;
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function categoryOptions(): array
    {
        return BookCategory::query()
            ->orderBy('name')
            ->get()
            ->map(fn (BookCategory $category): array => [
                'id' => $category->id,
                'name' => $category->name,
            ])
            ->all();
    }

    /**
     * @param  array<int, mixed>  $images
     * @return list<string>
     */
    private function cleanImages(array $images): array
    {
        return array_values(array_filter($images, static fn ($image) => filled($image)));
    }
}
