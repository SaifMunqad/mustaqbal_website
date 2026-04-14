<?php

namespace App\Models;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'highlighted_student_id',
        'type',
        'visibility',
        'title',
        'content',
        'images',
        'scheduled_at',
        'starts_at',
        'ends_at',
        'job_apply_url',
    ];

    protected function casts(): array
    {
        return [
            'type' => PostType::class,
            'visibility' => PostVisibility::class,
            'images' => 'array',
            'scheduled_at' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function highlightedStudent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'highlighted_student_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        if ($user) {
            return $query;
        }

        return $query
            ->whereIn('type', [
                PostType::News->value,
                PostType::Job->value,
                PostType::Event->value,
            ])
            ->where('visibility', PostVisibility::Public->value);
    }
}

