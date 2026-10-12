<?php

namespace App\Models;

use App\Enums\EmailCampaignStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subject',
        'body',
        'recipient_source',
        'total_count',
        'sent_count',
        'failed_count',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => EmailCampaignStatus::class,
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(EmailCampaignRecipient::class);
    }

    public function isComplete(): bool
    {
        return $this->sent_count + $this->failed_count >= $this->total_count;
    }

    public function markCompletedIfDone(): void
    {
        $this->refresh(['sent_count', 'failed_count', 'total_count']);

        if ($this->isComplete() && $this->status !== EmailCampaignStatus::Completed) {
            $this->update(['status' => EmailCampaignStatus::Completed]);
        }
    }
}
