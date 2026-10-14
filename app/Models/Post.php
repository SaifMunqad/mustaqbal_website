<?php

namespace App\Models;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Support\Translation\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    use HasFactory;
    use HasTranslations;

    /**
     * `title` and `content` are no longer columns: they are resolved from the
     * active locale's translation row (falling back through the shared chain),
     * then appended so serialized posts keep the same shape the frontend expects.
     *
     * @var array<int, string>
     */
    protected $appends = ['title', 'content'];

    protected $fillable = [
        'user_id',
        'highlighted_student_id',
        'type',
        'visibility',
        'images',
        'scheduled_at',
        'starts_at',
        'ends_at',
        'job_apply_url',
        'featured',
        'featured_from',
        'featured_until',
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
            'featured' => 'boolean',
            'featured_from' => 'datetime',
            'featured_until' => 'datetime',
        ];
    }

    /**
     * @return list<string>
     */
    public function translatedAttributes(): array
    {
        return ['title', 'content'];
    }

    public function getTitleAttribute(): ?string
    {
        return $this->translated('title');
    }

    public function getContentAttribute(): ?string
    {
        return $this->translated('content');
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

    public function scopeFeaturedCurrently(Builder $query): Builder
    {
        return $query
            ->where('featured', true)
            ->where(fn (Builder $query): Builder => $query
                ->whereNull('featured_from')
                ->orWhere('featured_from', '<=', now()))
            ->where(fn (Builder $query): Builder => $query
                ->whereNull('featured_until')
                ->orWhere('featured_until', '>=', now()));
    }

    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        if ($user) {
            return $query;
        }

        // Guests see posts explicitly marked public; recognition posts are included
        // so honored students/teachers/staff appear on the public showcase.
        return $query->where('visibility', PostVisibility::Public->value);
    }
}

