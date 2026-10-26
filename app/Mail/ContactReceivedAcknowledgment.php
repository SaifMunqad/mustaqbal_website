<?php

namespace App\Mail;

use App\Models\Message;
use App\Support\Mail\MailSource;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
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
            // Plain HTML view so the branded <x-mail.layout> shell (logo, school
            // name, © footer) renders; the markdown layout would strip it.
            view: 'mail.contact-received',
            with: [
                'name' => $this->message->sender_name,
                'subject' => $this->message->subject,
            ],
        );
    }

    /**
     * Tag the message so the unified mail log can label its origin.
     */
    public function headers(): Headers
    {
        return new Headers(text: [MailSource::HEADER => 'Contact Acknowledgment']);
    }

    /**
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
