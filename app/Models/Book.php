<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Support\Translation\HasTranslations;

class Book extends Model
{
    use HasFactory;
    use HasTranslations;

    /**
     * Localized text lives in `book_translations`; resolved for the active
     * locale and appended so serialized books keep the same shape the frontend
     * expects. Author/ISBN/year stay language-neutral columns on the parent.
     *
     * @var array<int, string>
     */
    protected $appends = ['title', 'publisher', 'description'];

    protected $fillable = [
        'slug',
        'author',
        'published_year',
        'isbn',
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

    /**
     * @return list<string>
     */
    public function translatedAttributes(): array
    {
        return ['title', 'publisher', 'description'];
    }

    public function getTitleAttribute(): ?string
    {
        return $this->translated('title');
    }

    public function getPublisherAttribute(): ?string
    {
        return $this->translated('publisher');
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->translated('description');
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

    /**
     * Search across language-neutral parent columns (author, ISBN, year) plus
     * the reader's-language title/publisher/description.
     */
    public function scopeSearch(Builder $query, ?string $term, ?string $locale = null): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        $locale = $locale ?? app()->getLocale();

        return $query->where(function (Builder $inner) use ($term, $locale): void {
            $inner->where('author', 'like', "%{$term}%")
                ->orWhere('isbn', 'like', "%{$term}%")
                ->orWhere('published_year', 'like', "%{$term}%")
                ->orWhereHas('translations', function (Builder $translation) use ($term, $locale): void {
                    $translation
                        ->whereHas('language', fn (Builder $language): Builder => $language->where('code', $locale))
                        ->where(fn (Builder $w): Builder => $w
                            ->where('title', 'like', "%{$term}%")
                            ->orWhere('publisher', 'like', "%{$term}%")
                            ->orWhere('description', 'like', "%{$term}%"));
                });
        });
    }
}
