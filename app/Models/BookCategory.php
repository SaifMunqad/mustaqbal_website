<?php

namespace App\Models;

use App\Support\Translation\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookCategory extends Model
{
    use HasFactory;
    use HasTranslations;

    protected $fillable = [
        'name',
        'slug',
    ];

    /**
     * @return list<string>
     */
    public function translatedAttributes(): array
    {
        return ['name'];
    }

    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }

    /**
     * Localized label. Resolves the reader's-language row, then falls back to
     * the parent `name` column (the default-language source of truth).
     */
    public function translatedName(?string $languageCode = null): string
    {
        return (string) $this->translated('name', $languageCode, $this->name);
    }
}
