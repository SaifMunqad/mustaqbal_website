<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplicationDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_application_id',
        'path',
        'original_name',
        'mime_type',
        'size',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class, 'job_application_id');
    }

    /**
     * @return array<string, mixed>
     */
    public function toRow(): array
    {
        return [
            'id' => $this->id,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
