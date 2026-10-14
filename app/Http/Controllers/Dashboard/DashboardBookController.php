<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCategory;
use App\Support\Rules\ImageLocation;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardBookController extends Controller
{
    private const DISK = 'public';

    /**
     * @var list<string>
     */
    private const TRANSLATED = ['title', 'publisher', 'description'];

    public function index(Request $request): Response
    {
        $books = Book::query()
            ->with(['category:id,name', 'translations.language'])
            ->search($request->string('search')->toString())
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Book $book): array => [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'published_year' => $book->published_year,
                'publisher' => $book->publisher,
                'has_file' => $book->isDownloadable(),
                'thumbnail' => $this->displayImage($book),
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
        $request->validate($this->rules());

        $payload = TranslationPayload::extract($request, self::TRANSLATED);
        $defaultTitle = TranslationPayload::defaultAttributes($payload)['title'] ?? '';

        $book = Book::query()->create([
            ...Arr::only($request->only($this->parentFields()), $this->parentFields()),
            'slug' => $this->uniqueSlug($defaultTitle),
            'images' => $this->cleanImages($request->input('images', [])),
        ]);

        TranslationPayload::apply($book->translations(), $payload);

        return redirect()
            ->route('dashboard.books.index')
            ->with('success', 'Book created.');
    }

    public function edit(Book $book): Response
    {
        $book->load(['translations.language']);

        return Inertia::render('dashboard/books/edit', [
            'book' => [
                'id' => $book->id,
                'title' => $book->title,
                'slug' => $book->slug,
                'author' => $book->author,
                'published_year' => $book->published_year,
                'isbn' => $book->isbn,
                'images' => $book->images ?? [],
                'thumbnail_path' => $book->thumbnail_path,
                'thumbnail' => $this->displayImage($book),
                'file_path' => $book->file_path,
                'file_url' => $book->file_path ? Storage::disk(self::DISK)->url($book->file_path) : null,
                'book_category_id' => $book->book_category_id,
            ],
            'translations' => $this->existingTranslations($book),
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(Request $request, Book $book): RedirectResponse
    {
        $request->validate($this->rules());

        $previousFile = $book->file_path;
        $previousThumb = $book->thumbnail_path;

        $book->fill([
            ...Arr::only($request->only($this->parentFields()), $this->parentFields()),
            'images' => $this->cleanImages($request->input('images', [])),
        ]);

        $book->save();

        TranslationPayload::apply($book->translations(), TranslationPayload::extract($request, self::TRANSLATED));

        // When the PDF is replaced, drop the orphaned file and thumbnail.
        if ($previousFile && $previousFile !== $book->file_path) {
            $this->deleteFiles($previousFile, $previousThumb);
        } elseif ($previousThumb && $previousThumb !== $book->thumbnail_path) {
            $this->deleteFiles(null, $previousThumb);
        }

        return redirect()
            ->route('dashboard.books.index')
            ->with('success', 'Book updated.');
    }

    public function destroy(Book $book): RedirectResponse
    {
        $this->deleteFiles($book->file_path, $book->thumbnail_path);

        $book->delete();

        return redirect()
            ->route('dashboard.books.index')
            ->with('success', 'Book deleted.');
    }

    /**
     * @param  array<int, string|null>  $paths
     */
    private function deleteFiles(?string ...$paths): void
    {
        foreach ($paths as $path) {
            if ($path !== null && Storage::disk(self::DISK)->exists($path)) {
                Storage::disk(self::DISK)->delete($path);
            }
        }
    }

    /**
     * Resolve a displayable image URL from the book's thumbnail — the first
     * page of the PDF, or a manually uploaded replacement.
     */
    private function displayImage(Book $book): ?string
    {
        if (filled($book->thumbnail_path)) {
            return Storage::disk(self::DISK)->url($book->thumbnail_path);
        }

        return null;
    }

    /**
     * Language-neutral parent columns written directly on the book row.
     *
     * @return list<string>
     */
    private function parentFields(): array
    {
        return ['author', 'published_year', 'isbn', 'book_category_id', 'file_path', 'thumbnail_path'];
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return array_merge([
            'author' => ['nullable', 'string', 'max:255'],
            'published_year' => ['nullable', 'integer', 'min:1000', 'max:2100'],
            'isbn' => ['nullable', 'string', 'max:64'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', new ImageLocation, 'max:2048'],
            'book_category_id' => ['nullable', 'exists:book_categories,id'],
            // Populated by the PDF uploader; stored as disk-relative paths.
            'file_path' => ['nullable', 'string', 'max:2048'],
            'thumbnail_path' => ['nullable', 'string', 'max:2048'],
        ], TranslationPayload::rules(self::TRANSLATED, [
            'title' => ['string', 'max:255'],
            'publisher' => ['string', 'max:255'],
            'description' => ['string', 'max:5000'],
        ], ['title']));
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'book';

        do {
            $slug = $base.'-'.Str::lower(Str::random(4));
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
     * @return array<string, array<string, string>>
     */
    private function existingTranslations(Book $book): array
    {
        return $book->translations
            ->filter(fn ($translation) => $translation->language)
            ->mapWithKeys(fn ($translation): array => [
                $translation->language->code => [
                    'title' => (string) $translation->title,
                    'publisher' => (string) $translation->publisher,
                    'description' => (string) $translation->description,
                ],
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
