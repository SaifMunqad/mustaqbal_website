<?php

namespace App\Models;

use App\Enums\JobApplicationStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'user_id',
        'first_name',
        'last_name',
        'father_name',
        'email',
        'phone',
        'city',
        'address',
        'experience',
        'cover_letter',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => JobApplicationStatus::class,
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class, 'job_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<JobApplicationDocument>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(JobApplicationDocument::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function scopeForStatus(Builder $query, ?JobApplicationStatus $status): Builder
    {
        return $status ? $query->where('status', $status->value) : $query;
    }

    /**
     * Search across the candidate's own name, email, phone and father's name.
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        return $query->where(fn (Builder $inner): Builder => $inner
            ->where('first_name', 'like', "%{$term}%")
            ->orWhere('last_name', 'like', "%{$term}%")
            ->orWhere('father_name', 'like', "%{$term}%")
            ->orWhere('email', 'like', "%{$term}%")
            ->orWhere('phone', 'like', "%{$term}%"));
    }

    /**
     * Row payload for the dashboard applications list.
     *
     * @return array<string, mixed>
     */
    public function toRow(): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'father_name' => $this->father_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'city' => $this->city,
            'status' => $this->status?->value,
            'job_id' => $this->job_id,
            'job_title' => $this->job?->title,
            'documents_count' => $this->documents_count ?? $this->documents()->count(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
