<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Exceptions\InsufficientStockException;
use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use App\Support\Cart;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CheckoutService
{
    public function __construct(private readonly Cart $cart)
    {
    }

    /**
     * Place an order from the current cart contents.
     *
     * Stock is re-checked and decremented under a row lock so concurrent orders
     * cannot oversell. On insufficient stock the transaction rolls back and an
     * {@see InsufficientStockException} is thrown listing the affected titles.
     *
     * @param  array{name: string, email: string, phone?: ?string, notes?: ?string}  $details
     */
    public function place(?User $user, array $details, PaymentMethod $paymentMethod): Order
    {
        $rows = $this->cart->content();

        if ($rows->isEmpty()) {
            throw new InvalidArgumentException('The cart is empty.');
        }

        return DB::transaction(function () use ($user, $details, $paymentMethod, $rows): Order {
            $order = Order::query()->create([
                'user_id' => $user?->id,
                'customer_name' => $details['name'],
                'customer_email' => $details['email'],
                'customer_phone' => $details['phone'] ?? null,
                'notes' => $details['notes'] ?? null,
                'payment_method' => $paymentMethod->value,
            ]);

            $total = 0.0;
            $shortages = [];

            foreach ($rows as $row) {
                /** @var Book $book */
                $book = Book::query()
                    ->whereKey($row['book']->id)
                    ->lockForUpdate()
                    ->first();

                if (! $book || ! $book->isPurchasable() || $book->stock < $row['quantity']) {
                    $shortages[] = $book?->title ?? ('#'.$row['book']->id);

                    continue;
                }

                $book->decrementStock($row['quantity']);

                $lineTotal = round((float) $book->price_afn * $row['quantity'], 2);
                $total += $lineTotal;

                $order->items()->create([
                    'book_id' => $book->id,
                    'title' => $book->title,
                    'author' => $book->author,
                    'unit_price' => $book->price_afn,
                    'quantity' => $row['quantity'],
                    'line_total' => $lineTotal,
                ]);
            }

            if ($shortages !== []) {
                // Roll back the whole order by throwing inside the transaction.
                throw new InsufficientStockException($shortages);
            }

            $order->update(['total' => round($total, 2)]);

            $this->cart->clear();

            return $order->load('items');
        });
    }
}
