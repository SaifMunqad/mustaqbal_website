<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'prefers_email_updates',
        'last_email_sent_at',
        'email_verified_at',
        'email_verification_token',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'prefers_email_updates' => 'boolean',
            'last_email_sent_at' => 'datetime',
            'email_verified_at' => 'datetime',
        ];
    }
}

