<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'name_translations',
    ];

    protected function casts(): array
    {
        return [
            'name_translations' => 'array',
        ];
    }

    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }

    /**
     * Localized label with graceful fallback to the base name.
     */
    public function translatedName(?string $languageCode = null): string
    {
        $locale = $languageCode ?? app()->getLocale();
        $translations = $this->name_translations ?? [];

        foreach (Language::fallbackCodes($locale) as $code) {
            if (filled($translations[$code] ?? null)) {
                return $translations[$code];
            }
        }

        return $this->name;
    }
}
