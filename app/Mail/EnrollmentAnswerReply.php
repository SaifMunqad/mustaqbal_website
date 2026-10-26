<?php

namespace App\Mail;

use App\Models\Enrollment;
use App\Models\EnrollmentReply;
use App\Support\Mail\MailContent;
use App\Support\Mail\MailSource;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to the guardian when an admin/employee records a reply against an
 * enrolment enquiry from the dashboard. The body is the composer's own rich
 * text — nothing is prepended or appended — so what they edit is exactly what
 * the recipient receives.
 */
class EnrollmentAnswerReply extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @var array{name: string, logo: string|null, brand: string, ink: string, muted: string, border: string, surface: string}|null
     */
    private ?array $branding = null;

    public function __construct(
        public Enrollment $enrollment,
        public EnrollmentReply $reply,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->reply->subject ?: 'Our response to your enrollment enquiry',
            from: new \Illuminate\Mail\Mailables\Address(
                (string) config('mail.from.address'),
                $this->branding()['name'],
            ),
        );
    }

    public function content(): Content
    {
        // A plain HTML view (not markdown) keeps the editor's markup intact;
        // the markdown renderer would escape the rich-text HTML.
        $bodyHtml = MailContent::richHtml($this->reply->body);

        return new Content(
            view: 'mail.enrollment-answer',
            with: [
                'subject' => $this->reply->subject ?: 'Our response to your enrollment enquiry',
                'branding' => $this->branding(),
                'bodyHtml' => $bodyHtml,
                'direction' => MailContent::direction($bodyHtml),
            ],
        );
    }

    /**
     * @return array{name: string, logo: string|null, brand: string, ink: string, muted: string, border: string, surface: string}
     */
    private function branding(): array
    {
        return $this->branding ??= MailContent::branding();
    }

    /**
     * Tag the message so the unified mail log can label its origin.
     */
    public function headers(): Headers
    {
        return new Headers(text: [MailSource::HEADER => 'Enrollment Reply']);
    }

    /**
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
