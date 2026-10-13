<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Job extends Model
{
    use HasFactory;

    protected $table = 'job_postings';

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'department',
        'category',
        'description',
        'requirements',
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

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
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
}
