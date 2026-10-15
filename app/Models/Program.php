<?php

namespace App\Models;

use App\Support\Translation\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use HasFactory;
    use HasTranslations;

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

    /**
     * @return list<string>
     */
    public function translatedAttributes(): array
    {
        return ['name', 'description', 'schedule', 'age_recommendation', 'classroom_number'];
    }

    public function typeTranslations(): HasMany
    {
        return $this->hasMany(ProgramTypeTranslation::class, 'program_type', 'program_type');
    }

    public function translatedName(?string $languageCode = null): string
    {
        return (string) $this->translated('name', $languageCode, $this->name);
    }

    public function translatedDescription(?string $languageCode = null): string
    {
        return (string) $this->translated('description', $languageCode, $this->description);
    }

    public function translatedSchedule(?string $languageCode = null): string
    {
        return (string) $this->translated('schedule', $languageCode, $this->schedule);
    }

    public function translatedAgeRecommendation(?string $languageCode = null): string
    {
        return (string) $this->translated('age_recommendation', $languageCode, $this->age_recommendation);
    }

    public function translatedClassroomNumber(?string $languageCode = null): ?string
    {
        $value = $this->translated('classroom_number', $languageCode, $this->classroom_number);

        return filled($value) ? (string) $value : null;
    }

    public function translatedProgramType(?string $languageCode = null): string
    {
        $translation = $this->resolveTypeTranslation($languageCode);

        return $translation?->label ?? $this->program_type;
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

        // Never return an unrelated language's label: callers fall back to the
        // language-neutral `program_type` key instead of bleeding another locale.
        return null;
    }
}
