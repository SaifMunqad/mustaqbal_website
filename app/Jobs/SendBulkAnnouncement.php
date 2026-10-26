<?php

namespace App\Jobs;

use App\Enums\EmailDeliveryStatus;
use App\Mail\BulkAnnouncement;
use App\Models\EmailCampaignRecipient;
use App\Models\MailLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendBulkAnnouncement implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [10, 60];

    public function __construct(public int $recipientId)
    {
    }

    public function handle(): void
    {
        $recipient = EmailCampaignRecipient::with('campaign')->find($this->recipientId);

        // Campaign deleted or recipient already delivered (e.g. retried job).
        if (! $recipient || ! $recipient->campaign || $recipient->status === EmailDeliveryStatus::Sent) {
            return;
        }

        Mail::to($recipient->email, $recipient->name ?? '')->send(new BulkAnnouncement($recipient->campaign, $recipient));

        $recipient->update([
            'status' => EmailDeliveryStatus::Sent,
            'sent_at' => now(),
            'error' => null,
        ]);
        $recipient->campaign->increment('sent_count');
        $recipient->campaign->markCompletedIfDone();
    }

    public function failed(Throwable $exception): void
    {
        $recipient = EmailCampaignRecipient::with('campaign')->find($this->recipientId);

        if (! $recipient || ! $recipient->campaign) {
            return;
        }

        $recipient->update([
            'status' => EmailDeliveryStatus::Failed,
            'error' => mb_substr($exception->getMessage(), 0, 1000),
        ]);
        $recipient->campaign->increment('failed_count');
        $recipient->campaign->markCompletedIfDone();

        // Reflect the failure in the unified mail log: the send attempt created a
        // pending row (via MessageSending) that never reached MessageSent, so mark
        // the newest matching one failed with the same reason.
        MailLog::query()
            ->where('status', EmailDeliveryStatus::Pending)
            ->where('recipients', $recipient->email)
            ->where('subject', $recipient->campaign->subject)
            ->latest('id')
            ->limit(1)
            ->get()
            ->each(fn (MailLog $log) => $log->update([
                'status' => EmailDeliveryStatus::Failed,
                'error' => mb_substr($exception->getMessage(), 0, 1000),
            ]));
    }
}
