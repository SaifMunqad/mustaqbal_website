<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnrollmentReply extends Model
{
    use HasFactory;

    protected $fillable = [
        'enrollment_id',
        'user_id',
        'subject',
        'body',
        'replied_at',
    ];

    protected function casts(): array
    {
        return [
            'replied_at' => 'datetime',
        ];
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Row payload for the reply thread on the dashboard enrolment screen.
     *
     * @return array<string, mixed>
     */
    public function toRow(): array
    {
        return [
            'id' => $this->id,
            'subject' => $this->subject,
            'body' => $this->body,
            'replied_at' => $this->replied_at?->toIso8601String(),
            'author' => $this->author?->only(['id', 'name', 'role']),
        ];
    }
}
