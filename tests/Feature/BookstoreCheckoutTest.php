<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Book;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BookstoreCheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function makeBook(int $stock = 5, float $price = 100.0): Book
    {
        return Book::query()->create([
            'title' => 'Algebra Foundations',
            'slug' => 'algebra-'.uniqid(),
            'author' => 'A. Teacher',
            'price_afn' => $price,
            'stock' => $stock,
            'is_available' => true,
        ]);
    }

    public function test_guest_can_add_to_cart(): void
    {
        $book = $this->makeBook();

        $this->post(route('store.cart.store'), [
            'book_id' => $book->id,
            'quantity' => 2,
        ])->assertRedirect();

        $this->assertSame(2, (int) session('cart.items')[$book->id]);
    }

    public function test_guest_can_place_an_order_and_stock_is_decremented(): void
    {
        Mail::fake();

        $book = $this->makeBook(stock: 5, price: 100.0);

        $this->withSession(['cart.items' => [$book->id => 2]])
            ->post(route('store.checkout.store'), [
                'name' => 'Guest Buyer',
                'email' => 'buyer@example.com',
                'payment_method' => PaymentMethod::CashOnDelivery->value,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'customer_email' => 'buyer@example.com',
            'status' => OrderStatus::Pending->value,
        ]);

        $order = Order::query()->first();
        $this->assertSame('200.00', number_format((float) $order->total, 2));
        $this->assertSame(3, $book->fresh()->stock);
    }

    public function test_checkout_is_rolled_back_when_stock_is_insufficient(): void
    {
        Mail::fake();

        $book = $this->makeBook(stock: 1, price: 50.0);

        $this->withSession(['cart.items' => [$book->id => 5]])
            ->post(route('store.checkout.store'), [
                'name' => 'Guest Buyer',
                'email' => 'buyer@example.com',
                'payment_method' => PaymentMethod::CashOnDelivery->value,
            ]);

        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(1, $book->fresh()->stock);
    }

    public function test_cancelling_an_order_releases_stock(): void
    {
        Mail::fake();

        $book = $this->makeBook(stock: 5, price: 100.0);

        $this->withSession(['cart.items' => [$book->id => 2]])
            ->post(route('store.checkout.store'), [
                'name' => 'Guest Buyer',
                'email' => 'buyer@example.com',
                'payment_method' => PaymentMethod::CashOnDelivery->value,
            ]);

        $order = Order::query()->with('items')->first();
        $this->assertSame(3, $book->fresh()->stock);

        $this->assertTrue($order->transitionTo(OrderStatus::Cancelled));

        $this->assertSame(5, $book->fresh()->stock);
    }
}
