<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'notes',
        'status',
        'payment_method',
        'payment_status',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'payment_method' => PaymentMethod::class,
            'payment_status' => PaymentStatus::class,
            'total' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order): void {
            $order->order_number ??= static::generateOrderNumber();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * A short, human-friendly, collision-resistant order number.
     */
    public static function generateOrderNumber(): string
    {
        do {
            $candidate = 'ORD-'.now()->format('Ymd').'-'.strtoupper(Str::random(5));
        } while (static::query()->where('order_number', $candidate)->exists());

        return $candidate;
    }

    public function canTransitionTo(OrderStatus $status): bool
    {
        return in_array($status, $this->status->nextStates(), true);
    }

    /**
     * Apply a guarded status transition. Cancelling releases reserved stock.
     */
    public function transitionTo(OrderStatus $newStatus, bool $restock = true): bool
    {
        if ($newStatus === $this->status) {
            return false;
        }

        if (! $this->canTransitionTo($newStatus)) {
            return false;
        }

        $wasHoldingStock = $this->status->holdsStock();

        $this->status = $newStatus;

        if ($newStatus === OrderStatus::Delivered) {
            $this->payment_status = PaymentStatus::Paid;
        }

        $this->save();

        if ($restock && $newStatus === OrderStatus::Cancelled && $wasHoldingStock) {
            $this->items->loadMissing('book');
            $this->items->each(function (OrderItem $item): void {
                if ($item->book) {
                    $item->book->restoreStock($item->quantity);
                }
            });
        }

        return true;
    }
}
