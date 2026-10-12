<?php

namespace App\Support;

use App\Models\Book;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Session;

/**
 * Session-backed shopping cart. Stores a map of book id => quantity and
 * resolves prices/stock from the database on read so the cart always reflects
 * current availability.
 */
class Cart
{
    private const SESSION_KEY = 'cart.items';

    /**
     * @return array<int, int> book id => quantity
     */
    public function raw(): array
    {
        /** @var array<int|string, int> $items */
        $items = Session::get(self::SESSION_KEY, []);

        return array_map('intval', $items);
    }

    public function add(Book $book, int $quantity = 1): void
    {
        $items = $this->raw();
        $items[$book->id] = ($items[$book->id] ?? 0) + max(1, $quantity);
        $this->persist($items);
    }

    public function update(int $bookId, int $quantity): void
    {
        $items = $this->raw();

        if ($quantity <= 0) {
            unset($items[$bookId]);
        } else {
            $items[$bookId] = $quantity;
        }

        $this->persist($items);
    }

    public function remove(int $bookId): void
    {
        $items = $this->raw();
        unset($items[$bookId]);
        $this->persist($items);
    }

    public function clear(): void
    {
        Session::put(self::SESSION_KEY, []);
    }

    /**
     * Resolve cart rows with their book, effective quantity and line totals.
     * Books that disappeared are dropped (and pruned from the session).
     *
     * @return Collection<int, array{book: Book, quantity: int, line_total: float}>
     */
    public function content(): Collection
    {
        $items = $this->raw();

        if ($items === []) {
            return collect();
        }

        $books = Book::query()->whereIn('id', array_keys($items))->get()->keyBy('id');

        $rows = collect($items)
            ->filter(fn (int $qty, int $id): bool => $qty > 0 && $books->has($id))
            ->map(function (int $qty, int $id) use ($books): array {
                $book = $books[$id];

                return [
                    'book' => $book,
                    'quantity' => $qty,
                    'line_total' => round((float) $book->price_afn * $qty, 2),
                ];
            })
            ->values();

        // Prune stale entries from the session.
        $pruned = $rows->mapWithKeys(fn (array $row): array => [$row['book']->id => $row['quantity']])->all();

        if (array_keys($pruned) !== array_keys($items)) {
            $this->persist($pruned);
        }

        return $rows;
    }

    public function total(): float
    {
        return (float) $this->content()->sum('line_total');
    }

    /**
     * Total quantity of items (cheap, no DB lookups).
     */
    public function count(): int
    {
        return array_sum($this->raw());
    }

    /**
     * Lightweight payload safe to share with every Inertia page view.
     *
     * @return array{count: int, total: float, items: list<array<string, mixed>>}
     */
    public function summary(): array
    {
        $rows = $this->content();

        return [
            'count' => (int) $rows->sum('quantity'),
            'total' => round((float) $rows->sum('line_total'), 2),
            'items' => $rows->map(fn (array $row): array => [
                'book_id' => $row['book']->id,
                'title' => $row['book']->title,
                'slug' => $row['book']->slug,
                'cover_image' => $row['book']->cover_image,
                'author' => $row['book']->author,
                'price_afn' => (float) $row['book']->price_afn,
                'stock' => $row['book']->stock,
                'quantity' => $row['quantity'],
                'line_total' => $row['line_total'],
                'purchasable' => $row['book']->isPurchasable() && $row['quantity'] <= $row['book']->stock,
            ])->values()->all(),
        ];
    }

    /**
     * @param  array<int, int>  $items
     */
    private function persist(array $items): void
    {
        Session::put(self::SESSION_KEY, array_filter(
            $items,
            static fn (int $qty): bool => $qty > 0,
        ));
    }
}
