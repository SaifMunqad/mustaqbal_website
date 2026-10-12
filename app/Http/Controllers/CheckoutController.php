<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Exceptions\InsufficientStockException;
use App\Http\Requests\CheckoutRequest;
use App\Mail\OrderConfirmation;
use App\Models\Order;
use App\Services\CheckoutService;
use App\Support\Cart;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CheckoutService $checkout,
        private readonly Cart $cart,
    ) {
    }

    public function create(): RedirectResponse|Response
    {
        if ($this->cart->content()->isEmpty()) {
            return redirect()
                ->route('store.index')
                ->with('error', 'Your cart is empty.');
        }

        return Inertia::render('school/store/checkout', [
            'paymentMethods' => PaymentMethod::options(),
        ]);
    }

    public function store(CheckoutRequest $request): RedirectResponse
    {
        $paymentMethod = PaymentMethod::from($request->string('payment_method')->toString());

        try {
            $order = $this->checkout->place($request->user(), [
                'name' => $request->string('name')->toString(),
                'email' => $request->string('email')->toString(),
                'phone' => $request->string('phone')->toString(),
                'notes' => $request->string('notes')->toString(),
            ], $paymentMethod);
        } catch (InsufficientStockException $exception) {
            return redirect()
                ->route('store.checkout')
                ->with('error', [
                    'title' => 'Some items are no longer available.',
                    'description' => implode(', ', $exception->titles),
                ]);
        }

        try {
            Mail::to($order->customer_email)->queue(new OrderConfirmation($order->load('items')));
        } catch (\Throwable) {
            // Never fail the order because the confirmation email could not queue.
        }

        return redirect()->route('store.order', $order->order_number);
    }

    public function show(string $orderNumber): Response
    {
        $order = Order::query()
            ->with('items.book:id,title,slug,cover_image')
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        return Inertia::render('school/store/order', [
            'order' => [
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'status' => $order->status?->label(),
                'payment_method' => $order->payment_method?->label(),
                'total' => (float) $order->total,
                'placed_at' => $order->created_at?->toIso8601String(),
                'items' => $order->items->map(fn ($item): array => [
                    'title' => $item->title,
                    'quantity' => $item->quantity,
                    'line_total' => (float) $item->line_total,
                ])->all(),
            ],
        ]);
    }
}
