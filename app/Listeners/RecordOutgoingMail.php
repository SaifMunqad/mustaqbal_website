<?php

namespace App\Listeners;

use App\Enums\EmailDeliveryStatus;
use App\Models\MailLog;
use App\Support\Mail\MailLogRegistry;
use App\Support\Mail\MailSource;
use Illuminate\Mail\Events\MessageSending;
use Symfony\Component\Mime\Address;

/**
 * Records every outbound email the moment it is about to be handed to the
 * transport, so the unified mail inbox ({@see MailLog}) covers bulk campaigns,
 * transactional replies and system mail alike.
 *
 * Logging must never break sending, so the whole body is guarded and any
 * database error is swallowed (the mail still goes out).
 */
class RecordOutgoingMail
{
    public function __construct(private readonly MailLogRegistry $registry) {}

    public function handle(MessageSending $event): void
    {
        try {
            $message = $event->message;
            $recipients = $this->addresses($message->getTo())
                ?: $this->addresses($message->getCc())
                ?: $this->addresses($message->getBcc());

            if ($recipients === '') {
                return;
            }

            $source = $message->getHeaders()->get(MailSource::HEADER)?->getBody();

            $log = MailLog::query()->create([
                'source' => is_string($source) && $source !== '' ? $source : null,
                'subject' => $message->getSubject() ?: null,
                'recipients' => $recipients,
                'status' => EmailDeliveryStatus::Pending,
            ]);

            $this->registry->put($message, $log->id);
        } catch (\Throwable) {
            // A logging failure must not stop the mail from being sent.
        }
    }

    /**
     * @param  array<int, Address>  $addresses
     */
    private function addresses(array $addresses): string
    {
        return implode(', ', array_map(static fn (Address $address): string => $address->getAddress(), $addresses));
    }
}
