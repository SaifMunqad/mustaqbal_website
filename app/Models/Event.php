<?php

namespace App\Models;

use App\Enums\EventAudience;
use App\Enums\EventStatus;
use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'excerpt',
        'body',
        'cover_image',
        'images',
        'location',
        'start_at',
        'end_at',
        'audience',
        'is_cancelled',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'audience' => EventAudience::class,
            'is_cancelled' => 'boolean',
            'is_published' => 'boolean',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The derived lifecycle status. Cancelled wins; otherwise computed from the
     * event window relative to now.
     */
    public function status(): EventStatus
    {
        if ($this->is_cancelled) {
            return EventStatus::Cancelled;
        }

        $now = now();
        $end = $this->end_at ?? $this->start_at;

        if ($now->lt($this->start_at)) {
            return EventStatus::Upcoming;
        }

        if ($now->lte($end)) {
            return EventStatus::Ongoing;
        }

        return EventStatus::Past;
    }

    /**
     * Restrict a query to events the given user is allowed to see.
     * Public events are visible to everyone; families/teachers events require an
     * authenticated account (management/admin see everything).
     */
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        $query->where('is_published', true);

        if ($user && $user->role->atLeast(UserRole::Management)) {
            return $query;
        }

        if ($user) {
            $allowed = match ($user->role) {
                UserRole::Teacher => [EventAudience::Public->value, EventAudience::Teachers->value],
                UserRole::Family => [EventAudience::Public->value, EventAudience::Families->value],
                default => [EventAudience::Public->value],
            };

            return $query->whereIn('audience', $allowed);
        }

        return $query->where('audience', EventAudience::Public->value);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query
            ->where('is_cancelled', false)
            ->where(fn (Builder $inner): Builder => $inner
                ->whereNull('end_at')
                ->orWhere('end_at', '>=', now()))
            ->orderBy('start_at');
    }
}
