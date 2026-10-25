<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Support\Translation\HasTranslations;

class Job extends Model
{
    use HasFactory;
    use HasTranslations;

    protected $table = 'job_postings';

    /**
     * Localized text now lives in `job_translations`; these accessors resolve it
     * for the active locale and are appended so serialized jobs keep the same
     * shape the frontend expects.
     *
     * @var array<int, string>
     */
    protected $appends = ['title', 'department', 'description', 'requirements'];

    protected $fillable = [
        'user_id',
        'slug',
        'category',
        'employment_type',
        'working_hours',
        'application_email',
        'application_url',
        'deadline',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return list<string>
     */
    public function translatedAttributes(): array
    {
        return ['title', 'department', 'description', 'requirements'];
    }

    public function getTitleAttribute(): ?string
    {
        return $this->translated('title');
    }

    public function getDepartmentAttribute(): ?string
    {
        return $this->translated('department');
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->translated('description');
    }

    public function getRequirementsAttribute(): ?string
    {
        return $this->translated('requirements');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Candidate applications received through the public apply portal.
     *
     * @return HasMany<JobApplication>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class, 'job_id');
    }

    /**
     * Card-ready payload shared by the public jobs listing and the home-page
     * "latest jobs" block so both render the same fields.
     *
     * @return array<string, mixed>
     */
    public function toCard(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'department' => $this->department,
            'category' => $this->category,
            'category_label' => $this->categoryLabel(),
            'description' => $this->description,
            'requirements' => $this->requirements,
            'employment_type' => $this->employment_type,
            'working_hours' => $this->working_hours,
            'application_email' => $this->application_email,
            'application_url' => $this->application_url,
            'deadline' => $this->deadline?->toDateString(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * Human-readable label for the program-style category (Course / School /
     * Islamic Madrasa). Returns null when unset so the UI can hide the badge.
     */
    public function categoryLabel(): ?string
    {
        return match ($this->category) {
            'course' => 'Course',
            'school' => 'School',
            'islamic_madrasa' => 'Islamic Madrasa',
            default => null,
        };
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->where(fn (Builder $inner): Builder => $inner
                ->whereNull('deadline')
                ->orWhere('deadline', '>=', now()->toDateString()))
            ->orderByDesc('created_at');
    }

    /**
     * Localized text search over the reader's-language translation rows.
     */
    public function scopeSearch(Builder $query, ?string $term, ?string $locale = null): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        $locale = $locale ?? app()->getLocale();

        return $query->whereHas('translations', function (Builder $translation) use ($term, $locale): void {
            $translation
                ->whereHas('language', fn (Builder $language): Builder => $language->where('code', $locale))
                ->where(fn (Builder $inner): Builder => $inner
                    ->where('title', 'like', "%{$term}%")
                    ->orWhere('department', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%"));
        });
    }
}
