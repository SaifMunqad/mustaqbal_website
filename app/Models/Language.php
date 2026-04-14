<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Language extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
    ];

    public function programTranslations(): HasMany
    {
        return $this->hasMany(ProgramTranslation::class);
    }

    public function programTypeTranslations(): HasMany
    {
        return $this->hasMany(ProgramTypeTranslation::class);
    }

    /**
     * @return array<int, string>
     */
    public static function fallbackCodes(?string $preferred = null): array
    {
        $fallback = (string) config('app.fallback_locale', 'en');

        return array_values(array_unique(array_filter([
            $preferred,
            $fallback,
            'en',
        ])));
    }
}

