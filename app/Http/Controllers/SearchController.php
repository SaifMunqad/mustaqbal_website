<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Book;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function index(Request $request): Response
    {
        $term = trim($request->string('q')->toString());

        $articles = collect();
        $events = collect();
        $books = collect();

        if (mb_strlen($term) >= 2) {
            $articles = Article::query()
                ->where('is_published', true)
                ->whereNotNull('published_at')
                ->where(fn ($q) => $q
                    ->where('title', 'like', "%{$term}%")
                    ->orWhere('excerpt', 'like', "%{$term}%")
                    ->orWhere('body', 'like', "%{$term}%"))
                ->latest('published_at')
                ->limit(10)
                ->get()
                ->map(fn (Article $article): array => [
                    'slug' => $article->slug,
                    'title' => $article->title,
                    'subtitle' => $article->excerpt,
                    'href' => "/school/articles/{$article->slug}",
                ]);

            $events = Event::query()
                ->visibleTo($request->user())
                ->where(fn ($q) => $q
                    ->where('title', 'like', "%{$term}%")
                    ->orWhere('excerpt', 'like', "%{$term}%")
                    ->orWhere('body', 'like', "%{$term}%"))
                ->orderBy('start_at')
                ->limit(10)
                ->get()
                ->map(fn (Event $event): array => [
                    'title' => $event->title,
                    'subtitle' => $event->location,
                    'href' => "/school/events/{$event->slug}",
                ]);

            $books = Book::query()
                ->search($term)
                ->with('category:id,name')
                ->limit(12)
                ->get()
                ->map(fn (Book $book): array => [
                    'title' => $book->title,
                    'subtitle' => $book->author,
                    'href' => "/store/books/{$book->slug}",
                ]);
        }

        return Inertia::render('school/search/index', [
            'q' => $term,
            'results' => [
                'articles' => $articles,
                'events' => $events,
                'books' => $books,
            ],
        ]);
    }
}
