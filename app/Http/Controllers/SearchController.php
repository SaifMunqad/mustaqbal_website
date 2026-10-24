<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Book;
use App\Models\Event;
use App\Services\PdfThumbnailService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function __construct(private readonly PdfThumbnailService $thumbnails)
    {
    }

    public function index(Request $request): Response
    {
        $term = trim($request->string('q')->toString());
        $isSearch = mb_strlen($term) >= 2;

        return Inertia::render('school/search/school-search', [
            'q' => $term,
            'isSearch' => $isSearch,
            'results' => [
                'articles' => $this->articles($request, $term, $isSearch),
                'events' => $this->events($request, $term, $isSearch),
                'books' => $this->books($request, $term, $isSearch),
            ],
        ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function articles(Request $request, string $term, bool $isSearch): Collection
    {
        $query = Article::query()
            ->with('author:id,name')
            ->where('is_published', true)
            ->whereNotNull('published_at');

        if ($isSearch) {
            $query->where(fn ($q) => $q
                ->where('title', 'like', "%{$term}%")
                ->orWhere('excerpt', 'like', "%{$term}%")
                ->orWhere('body', 'like', "%{$term}%"));
        }

        return $query
            ->latest('published_at')
            ->limit($isSearch ? 12 : 4)
            ->get()
            ->map(fn (Article $article): array => [
                'id' => $article->id,
                'title' => $article->title,
                'href' => "/school/articles/{$article->slug}",
                'image' => $article->cover_image ?: ($article->images[0] ?? null),
                'subtitle' => $article->writer_name ?: $article->author?->name,
                'date' => $article->published_at?->toIso8601String(),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function events(Request $request, string $term, bool $isSearch): Collection
    {
        $query = Event::query()
            ->with('translations.language')
            ->visibleTo($request->user());

        if ($isSearch) {
            $query->search($term);
        }

        return $query
            ->orderBy('start_at')
            ->limit($isSearch ? 12 : 4)
            ->get()
            ->map(fn (Event $event): array => [
                'id' => $event->id,
                'title' => $event->title,
                'href' => "/school/events/{$event->slug}",
                'image' => $event->cover_image ?: ($event->images[0] ?? null),
                'subtitle' => $event->location,
                'date' => $event->start_at?->toIso8601String(),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function books(Request $request, string $term, bool $isSearch): Collection
    {
        $query = Book::query()->with(['category:id,name', 'category.translations.language', 'translations.language']);

        if ($isSearch) {
            $query->search($term);
        }

        return $query
            ->latest('created_at')
            ->limit($isSearch ? 12 : 4)
            ->get()
            ->map(fn (Book $book): array => [
                'id' => $book->id,
                'title' => $book->title,
                'slug' => $book->slug,
                'published_year' => $book->published_year,
                'publisher' => $book->publisher,
                'thumbnail' => $this->thumbnailUrl($book),
                'downloadable' => $book->isDownloadable(),
                'download_url' => $book->isDownloadable() ? route('store.books.download', $book->slug) : null,
                'category' => $book->category?->translatedName(),
            ]);
    }

    /**
     * Cover image for a book card: the first gallery image when present,
     * otherwise the PDF-generated thumbnail.
     */
    private function thumbnailUrl(Book $book): ?string
    {
        $cover = $book->images[0] ?? null;

        return filled($cover) ? $cover : $this->thumbnails->url($book->thumbnail_path);
    }
}
