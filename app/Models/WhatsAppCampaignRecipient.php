<?php

namespace App\Models;

use App\Enums\WhatsAppDeliveryStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppCampaignRecipient extends Model
{
    use HasFactory;

    // Laravel would otherwise derive "whats_app_campaign_recipients" from the class name.
    protected $table = 'whatsapp_campaign_recipients';

    protected $fillable = [
        'whatsapp_campaign_id',
        'name',
        'phone',
        'status',
        'error',
        'message_id',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => WhatsAppDeliveryStatus::class,
            'sent_at' => 'datetime',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(WhatsAppCampaign::class, 'whatsapp_campaign_id');
    }
}
