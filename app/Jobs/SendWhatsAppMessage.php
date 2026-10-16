<?php

namespace App\Jobs;

use App\Enums\WhatsAppDeliveryStatus;
use App\Models\WhatsAppCampaignRecipient;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class SendWhatsAppMessage implements ShouldQueue
{
    use Queueable;

    /**
     * Meta's errors are almost always permanent (invalid number, unapproved
     * template, expired token), so a single attempt is enough — retrying would
     * just hammer the API and worsen quality ratings. Failures are recorded and
     * can be re-run explicitly via the campaign retry action.
     */
    public int $tries = 1;

    public function __construct(public int $recipientId)
    {
    }

    public function handle(WhatsAppService $whatsapp): void
    {
        $recipient = WhatsAppCampaignRecipient::with('campaign')->find($this->recipientId);

        // Campaign deleted or recipient already delivered (e.g. a re-run).
        if (! $recipient || ! $recipient->campaign || $recipient->status === WhatsAppDeliveryStatus::Sent) {
            return;
        }

        $messageId = $whatsapp->sendForCampaign($recipient->campaign, $recipient->phone);

        $recipient->update([
            'status' => WhatsAppDeliveryStatus::Sent,
            'sent_at' => now(),
            'error' => null,
            'message_id' => $messageId,
        ]);
        $recipient->campaign->increment('sent_count');
        $recipient->campaign->markCompletedIfDone();
    }

    public function failed(Throwable $exception): void
    {
        $recipient = WhatsAppCampaignRecipient::with('campaign')->find($this->recipientId);

        if (! $recipient || ! $recipient->campaign) {
            return;
        }

        $recipient->update([
            'status' => WhatsAppDeliveryStatus::Failed,
            'error' => mb_substr($exception->getMessage(), 0, 1000),
        ]);
        $recipient->campaign->increment('failed_count');
        $recipient->campaign->markCompletedIfDone();
    }
}
