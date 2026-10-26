<?php

namespace App\Models;

use App\Enums\EnrollmentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_name',
        'guardian_name',
        'email',
        'phone',
        'grade',
        'date_of_birth',
        'address',
        'notes',
        'status',
        'prefers_email_updates',
        'last_email_sent_at',
        'email_verified_at',
        'email_verification_token',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'status' => EnrollmentStatus::class,
            'prefers_email_updates' => 'boolean',
            'last_email_sent_at' => 'datetime',
            'email_verified_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<EnrollmentReply>
     */
    public function replies(): HasMany
    {
        return $this->hasMany(EnrollmentReply::class);
    }

    public function scopeForStatus(Builder $query, ?EnrollmentStatus $status): Builder
    {
        return $status ? $query->where('status', $status->value) : $query;
    }

    /**
     * Search across the student, guardian, contact details and grade.
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        return $query->where(fn (Builder $inner): Builder => $inner
            ->where('student_name', 'like', "%{$term}%")
            ->orWhere('guardian_name', 'like', "%{$term}%")
            ->orWhere('email', 'like', "%{$term}%")
            ->orWhere('phone', 'like', "%{$term}%")
            ->orWhere('grade', 'like', "%{$term}%"));
    }

    /**
     * Row payload for the dashboard enrolments list.
     *
     * @return array<string, mixed>
     */
    public function toRow(): array
    {
        return [
            'id' => $this->id,
            'student_name' => $this->student_name,
            'guardian_name' => $this->guardian_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'grade' => $this->grade,
            'status' => $this->status?->value,
            'replies_count' => $this->replies_count ?? $this->replies()->count(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
