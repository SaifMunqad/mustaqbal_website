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
        'published_year',
        'publisher',
        'isbn',
        'description',
        'images',
        'file_path',
        'thumbnail_path',
        'book_category_id',
    ];

    protected function casts(): array
    {
        return [
            'published_year' => 'integer',
            'images' => 'array',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BookCategory::class, 'book_category_id');
    }

    /**
     * A book is downloadable once its PDF file is present. Availability no
     * longer depends on stock/pricing since books are offered for free.
     */
    public function isDownloadable(): bool
    {
        return filled($this->file_path);
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
                ->orWhere('publisher', 'like', "%{$term}%")
                ->orWhere('isbn', 'like', "%{$term}%")
                ->orWhere('published_year', 'like', "%{$term}%");
        });
    }
}
