<?php

namespace App\Mail;

use App\Models\EmailCampaign;
use App\Models\EmailCampaignRecipient;
use App\Support\Mail\MailContent;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Bulk announcement sent to one recipient at a time.
 *
 * The body is the campaign's own rich text — nothing is prepended or appended —
 * and the shell (logo, school name, colours) comes from the site settings, so
 * the same code serves every school using the platform.
 */
class BulkAnnouncement extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * School identity resolved once per message, since both the envelope and
     * the view need it.
     *
     * @var array{name: string, logo: string|null, brand: string, ink: string, muted: string, border: string, surface: string}|null
     */
    private ?array $branding = null;

    public function __construct(
        public EmailCampaign $campaign,
        public EmailCampaignRecipient $recipient,
    ) {}

    public function envelope(): Envelope
    {
        $from = config('mail.from.address');

        return new Envelope(
            subject: $this->campaign->subject,
            // Show the school's name in the inbox instead of the app name.
            from: filled($from) ? new Address($from, $this->branding()['name']) : null,
        );
    }

    public function content(): Content
    {
        $bodyHtml = MailContent::html($this->campaign);

        return new Content(
            // A plain HTML view (not markdown) keeps the editor's markup intact:
            // the markdown renderer escapes raw HTML.
            view: 'mail.bulk-announcement',
            // `campaign` and `recipient` reach the view through this mailable's
            // public properties.
            with: [
                'branding' => $this->branding(),
                'bodyHtml' => $bodyHtml,
                'direction' => MailContent::direction($bodyHtml),
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

    /**
     * @return array{name: string, logo: string|null, brand: string, ink: string, muted: string, border: string, surface: string}
     */
    private function branding(): array
    {
        return $this->branding ??= MailContent::branding();
    }
}
