<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookCategory;
use App\Services\PdfThumbnailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookstoreController extends Controller
{
    public function __construct(private readonly PdfThumbnailService $thumbnails)
    {
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $category = $request->string('category')->toString();

        $books = Book::query()
            ->with(['category:id,name,slug', 'category.translations.language', 'translations.language'])
            ->search($search)
            ->when($category !== '', fn ($query) => $query->whereHas(
                'category',
                fn ($q) => $q->where('slug', $category),
            ))
            ->orderByDesc('created_at')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Book $book): array => $this->presentCard($book));

        return Inertia::render('school/store/index', [
            'books' => $books,
            'categories' => BookCategory::query()
                ->with('translations.language')
                ->orderBy('name')
                ->get()
                ->map(fn (BookCategory $categoryModel): array => [
                    'slug' => $categoryModel->slug,
                    'name' => $categoryModel->translatedName(),
                ]),
            'filters' => [
                'search' => $search,
                'category' => $category,
            ],
        ]);
    }

    public function show(Request $request, Book $book): Response
    {
        $book->load(['category:id,name,slug', 'category.translations.language', 'translations.language']);

        $related = Book::query()
            ->with(['translations.language', 'category.translations.language'])
            ->whereKeyNot($book->id)
            ->when($book->book_category_id, fn ($q) => $q->where('book_category_id', $book->book_category_id))
            ->limit(4)
            ->get()
            ->map(fn (Book $item): array => $this->presentCard($item));

        return Inertia::render('school/store/show', [
            'book' => [
                'id' => $book->id,
                'title' => $book->title,
                'slug' => $book->slug,
                'author' => $book->author,
                'published_year' => $book->published_year,
                'publisher' => $book->publisher,
                'isbn' => $book->isbn,
                'description' => $book->description,
                'thumbnail' => $this->thumbnailUrl($book),
                'images' => $book->images,
                'downloadable' => $book->isDownloadable(),
                'download_url' => $book->isDownloadable() ? route('store.books.download', $book->slug) : null,
                'category' => $book->category?->translatedName(),
            ],
            'related' => $related,
        ]);
    }

    /**
     * Stream the book's PDF to the visitor for free, direct download.
     */
    public function download(Book $book): StreamedResponse
    {
        abort_unless($book->isDownloadable(), 404);

        $name = Str::slug($book->title).'.pdf';

        return response()
            ->streamDownload(
                fn () => print(Storage::disk('public')->get($book->file_path)),
                $name,
                ['Content-Type' => 'application/pdf'],
            );
    }

    /**
     * Shared shape for a book card on both the listing and related sections.
     *
     * @return array<string, mixed>
     */
    private function presentCard(Book $book): array
    {
        return [
            'id' => $book->id,
            'title' => $book->title,
            'slug' => $book->slug,
            'author' => $book->author,
            'published_year' => $book->published_year,
            'publisher' => $book->publisher,
            'thumbnail' => $this->thumbnailUrl($book),
            'downloadable' => $book->isDownloadable(),
            'download_url' => $book->isDownloadable() ? route('store.books.download', $book->slug) : null,
            'category' => $book->category?->translatedName(),
        ];
    }

    /**
     * The image shown for a book (on cards and as the detail hero).
     *
     * Prefers the first gallery image (a real cover picture) and falls back to
     * the PDF-generated thumbnail when the book has no gallery images.
     */
    private function thumbnailUrl(Book $book): ?string
    {
        $cover = $book->images[0] ?? null;

        return filled($cover) ? $cover : $this->thumbnails->url($book->thumbnail_path);
    }
}
