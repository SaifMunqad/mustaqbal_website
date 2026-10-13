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
