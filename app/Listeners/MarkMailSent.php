<?php

namespace App\Listeners;

use App\Enums\EmailDeliveryStatus;
use App\Models\MailLog;
use App\Support\Mail\MailLogRegistry;
use Illuminate\Mail\Events\MessageSent;

/**
 * Flips the mail-log row created by {@see RecordOutgoingMail} to "sent" once the
 * transport confirms delivery. The row is located through the in-memory
 * registry (keyed by the message object), so no internal id is ever embedded in
 * the real email.
 */
class MarkMailSent
{
    public function __construct(private readonly MailLogRegistry $registry) {}

    public function handle(MessageSent $event): void
    {
        try {
            $id = $this->registry->take($event->message);

            if ($id === null) {
                return;
            }

            MailLog::query()->whereKey($id)->update([
                // A query-builder update bypasses the model's enum cast, so the
                // backing value is written explicitly.
                'status' => EmailDeliveryStatus::Sent->value,
                'sent_at' => now(),
                'error' => null,
            ]);
        } catch (\Throwable) {
            // Never let a logging failure surface to the sender.
        }
    }
}
