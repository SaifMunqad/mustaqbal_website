<?php

namespace App\Models;

use App\Enums\WhatsAppCampaignStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppCampaign extends Model
{
    use HasFactory;

    // Laravel would otherwise derive "whats_app_campaigns" from the class name.
    protected $table = 'whatsapp_campaigns';

    protected $fillable = [
        'user_id',
        'mode',
        'message',
        'template_name',
        'template_language',
        'template_variables',
        'recipient_source',
        'total_count',
        'sent_count',
        'failed_count',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => WhatsAppCampaignStatus::class,
            'template_variables' => 'array',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(WhatsAppCampaignRecipient::class, 'whatsapp_campaign_id');
    }

    /**
     * A campaign sends an approved template when one is named, otherwise a
     * free-form text body.
     */
    public function isTemplate(): bool
    {
        return $this->mode === 'template' && filled($this->template_name);
    }

    public function isComplete(): bool
    {
        return $this->sent_count + $this->failed_count >= $this->total_count;
    }

    public function markCompletedIfDone(): void
    {
        $this->refresh(['sent_count', 'failed_count', 'total_count']);

        if ($this->isComplete() && $this->status !== WhatsAppCampaignStatus::Completed) {
            $this->update(['status' => WhatsAppCampaignStatus::Completed]);
        }
    }
}
