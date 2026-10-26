<?php

namespace App\Models;

use App\Enums\EmailDeliveryStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A single outbound email recorded by the mail-event listeners.
 *
 * This is an audit/inbox view over everything the app sends, independent of the
 * campaign tables: bulk announcements, transactional replies and system mail all
 * land here. Delivery status reuses {@see EmailDeliveryStatus}.
 */
class MailLog extends Model
{
    protected $fillable = [
        'source',
        'subject',
        'recipients',
        'status',
        'error',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => EmailDeliveryStatus::class,
            'sent_at' => 'datetime',
        ];
    }

    /**
     * Narrow to one delivery status (or leave untouched when null/blank).
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        return $query->when(
            filled($status) && EmailDeliveryStatus::tryFrom($status) !== null,
            fn (Builder $q): Builder => $q->where('status', $status)
        );
    }

    /**
     * Match a recipient address or subject line (case-insensitive best effort).
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        $like = '%'.$term.'%';

        return $query->where(fn (Builder $q): Builder => $q
            ->where('recipients', 'like', $like)
            ->orWhere('subject', 'like', $like)
            ->orWhere('source', 'like', $like));
    }
}
