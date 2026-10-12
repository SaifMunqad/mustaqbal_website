<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = Order::query()
            ->with('user:id,name')
            ->withCount('items')
            ->when($request->string('status')->toString(), fn ($q, string $status) => $q->where('status', $status))
            ->when($request->string('search')->toString(), function ($q, string $search): void {
                $q->where(function ($inner) use ($search): void {
                    $inner->where('order_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Order $order): array => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'status' => $order->status?->value,
                'payment_method' => $order->payment_method?->value,
                'payment_status' => $order->payment_status?->value,
                'total' => (float) $order->total,
                'items_count' => $order->items_count,
                'placed_at' => $order->created_at?->toIso8601String(),
            ]);

        return Inertia::render('dashboard/orders/index', [
            'orders' => $orders,
            'statusOptions' => OrderStatus::options(),
            'filters' => [
                'status' => $request->string('status')->toString(),
                'search' => $request->string('search')->toString(),
            ],
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load(['items.book:id,title,slug,cover_image', 'user:id,name']);

        $allowedTransitions = collect($order->status->nextStates())
            ->map(fn (OrderStatus $status): array => ['value' => $status->value, 'label' => $status->label()])
            ->all();

        return Inertia::render('dashboard/orders/show', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
                'notes' => $order->notes,
                'status' => $order->status?->value,
                'status_label' => $order->status?->label(),
                'payment_method' => $order->payment_method?->label(),
                'payment_status' => $order->payment_status?->label(),
                'total' => (float) $order->total,
                'placed_at' => $order->created_at?->toIso8601String(),
                'items' => $order->items->map(fn ($item): array => [
                    'title' => $item->title,
                    'author' => $item->author,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'line_total' => (float) $item->line_total,
                ])->all(),
            ],
            'allowedTransitions' => $allowedTransitions,
        ]);
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(OrderStatus::values())],
        ]);

        $target = OrderStatus::from($validated['status']);

        if (! $order->canTransitionTo($target)) {
            return back()->withErrors([
                'status' => "Cannot change an order from {$order->status->label()} to {$target->label()}.",
            ]);
        }

        $order->transitionTo($target);

        return back()->with('toast', [
            'variant' => 'success',
            'title' => "Order marked as {$target->label()}.",
        ]);
    }
}
