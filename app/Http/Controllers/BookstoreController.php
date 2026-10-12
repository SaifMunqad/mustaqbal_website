<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookstoreController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $category = $request->string('category')->toString();

        $books = Book::query()
            ->with('category:id,name,slug')
            ->search($search)
            ->when($category !== '', fn ($query) => $query->whereHas(
                'category',
                fn ($q) => $q->where('slug', $category),
            ))
            ->orderByDesc('created_at')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Book $book): array => [
                'id' => $book->id,
                'title' => $book->title,
                'slug' => $book->slug,
                'author' => $book->author,
                'price_afn' => (float) $book->price_afn,
                'cover_image' => $book->cover_image,
                'stock' => $book->stock,
                'is_available' => $book->is_available,
                'category' => $book->category?->translatedName(),
            ]);

        return Inertia::render('school/store/index', [
            'books' => $books,
            'categories' => BookCategory::query()
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
        $book->load('category:id,name,slug');

        $related = Book::query()
            ->whereKeyNot($book->id)
            ->when($book->book_category_id, fn ($q) => $q->where('book_category_id', $book->book_category_id))
            ->purchasable()
            ->limit(4)
            ->get()
            ->map(fn (Book $item): array => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'author' => $item->author,
                'price_afn' => (float) $item->price_afn,
                'cover_image' => $item->cover_image,
                'stock' => $item->stock,
                'is_available' => $item->is_available,
            ]);

        return Inertia::render('school/store/show', [
            'book' => [
                'id' => $book->id,
                'title' => $book->title,
                'slug' => $book->slug,
                'author' => $book->author,
                'isbn' => $book->isbn,
                'description' => $book->description,
                'price_afn' => (float) $book->price_afn,
                'cover_image' => $book->cover_image,
                'images' => $book->images,
                'stock' => $book->stock,
                'is_available' => $book->is_available,
                'category' => $book->category?->translatedName(),
            ],
            'related' => $related,
        ]);
    }
}
