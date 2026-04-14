<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'program_type',
        'description',
        'schedule',
        'fees',
        'age_recommendation',
        'classroom_number',
        'available_for_enroll',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'fees' => 'decimal:2',
            'available_for_enroll' => 'boolean',
        ];
    }

    public function translations(): HasMany
    {
        return $this->hasMany(ProgramTranslation::class);
    }

    public function typeTranslations(): HasMany
    {
        return $this->hasMany(ProgramTypeTranslation::class, 'program_type', 'program_type');
    }

    public function translatedName(?string $languageCode = null): string
    {
        return $this->resolveTranslation($languageCode)?->name ?? $this->name;
    }

    public function translatedDescription(?string $languageCode = null): string
    {
        return $this->resolveTranslation($languageCode)?->description ?? $this->description;
    }

    public function translatedProgramType(?string $languageCode = null): string
    {
        $translation = $this->resolveTypeTranslation($languageCode);

        return $translation?->label ?? $this->program_type;
    }

    public function syncDefaultTranslation(string $languageCode = 'en'): void
    {
        $language = Language::query()->where('code', $languageCode)->first();

        if (! $language) {
            return;
        }

        $this->translations()->updateOrCreate(
            ['language_id' => $language->id],
            [
                'name' => $this->name,
                'description' => $this->description,
            ],
        );
    }

    private function resolveTranslation(?string $languageCode = null): ?ProgramTranslation
    {
        $translations = $this->relationLoaded('translations')
            ? $this->translations
            : $this->translations()->with('language')->get();

        foreach (Language::fallbackCodes($languageCode ?? app()->getLocale()) as $code) {
            $match = $translations->firstWhere('language.code', $code);
            if ($match) {
                return $match;
            }
        }

        return $translations->first();
    }

    private function resolveTypeTranslation(?string $languageCode = null): ?ProgramTypeTranslation
    {
        $translations = $this->relationLoaded('typeTranslations')
            ? $this->typeTranslations
            : $this->typeTranslations()->with('language')->get();

        foreach (Language::fallbackCodes($languageCode ?? app()->getLocale()) as $code) {
            $match = $translations->firstWhere('language.code', $code);
            if ($match) {
                return $match;
            }
        }

        return $translations->first();
    }
}

