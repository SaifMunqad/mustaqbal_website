<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Support\Cart;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private readonly Cart $cart)
    {
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'book_id' => ['required', 'exists:books,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:999'],
        ]);

        $book = Book::query()->findOrFail($validated['book_id']);

        if (! $book->isPurchasable()) {
            return back()->with('toast', [
                'variant' => 'error',
                'title' => 'That book is currently unavailable.',
            ]);
        }

        $this->cart->add($book, (int) ($validated['quantity'] ?? 1));

        return back()->with('toast', [
            'variant' => 'success',
            'title' => 'Added to cart.',
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'book_id' => ['required', 'integer'],
            'quantity' => ['required', 'integer', 'min:0', 'max:999'],
        ]);

        $this->cart->update((int) $validated['book_id'], (int) $validated['quantity']);

        return back();
    }

    public function destroy(Request $request, int $bookId): RedirectResponse
    {
        $this->cart->remove($bookId);

        return back();
    }

    public function clear(): RedirectResponse
    {
        $this->cart->clear();

        return back();
    }
}
