<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'author',
        'isbn',
        'description',
        'price_afn',
        'stock',
        'cover_image',
        'images',
        'book_category_id',
        'is_available',
    ];

    protected function casts(): array
    {
        return [
            'price_afn' => 'decimal:2',
            'stock' => 'integer',
            'images' => 'array',
            'is_available' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BookCategory::class, 'book_category_id');
    }

    public function scopePurchasable(Builder $query): Builder
    {
        return $query->where('is_available', true)->where('stock', '>', 0);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $inner) use ($term): void {
            $inner->where('title', 'like', "%{$term}%")
                ->orWhere('author', 'like', "%{$term}%")
                ->orWhere('isbn', 'like', "%{$term}%");
        });
    }

    public function isPurchasable(): bool
    {
        return $this->is_available && $this->stock > 0;
    }

    /**
     * Reduce stock, never dropping below zero. Returns true when at least one
     * unit was available and decremented. The `stock >= quantity` guard makes
     * this an atomic conditional update.
     */
    public function decrementStock(int $quantity): bool
    {
        $affected = $this->newQuery()
            ->whereKey($this->id)
            ->where('stock', '>=', $quantity)
            ->decrement('stock', $quantity);

        if ($affected > 0) {
            $this->refresh();

            return true;
        }

        return false;
    }

    public function restoreStock(int $quantity): void
    {
        $this->newQuery()->whereKey($this->id)->increment('stock', $quantity);
        $this->refresh();
    }
}
