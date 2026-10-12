<?php

namespace App\Mail;

use App\Models\Message;
use App\Models\MessageAnswer;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to the original contact-inquiry author when management records an answer
 * from the dashboard. Each recorded answer triggers one reply email.
 */
class ContactAnswerReply extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Message $message,
        public MessageAnswer $answer,
    ) {
    }

    public function envelope(): Envelope
    {
        $subject = $this->message->subject
            ? 'Re: '.$this->message->subject
            : 'Our response to your message';

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.contact-answer',
            with: [
                'name' => $this->message->sender_name,
                'originalBody' => $this->message->body,
                'answerBody' => $this->answer->body,
                'answeredAt' => $this->answer->answered_at,
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
