<?php

namespace App\Mail;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Auto-acknowledgment sent to a visitor right after they submit the public
 * contact form, thanking them and confirming we'll reply soon.
 */
class ContactReceivedAcknowledgment extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Message $message,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'We received your message',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.contact-received',
            with: [
                'name' => $this->message->sender_name,
                'subject' => $this->message->subject,
            ],
        );
    }

    /**
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
