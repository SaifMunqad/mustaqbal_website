<?php

namespace App\Support\Mail;

/**
 * Shared identifiers for the outbound mail log.
 */
final class MailSource
{
    /**
     * Header a mailable sets to advertise its human-readable origin (e.g.
     * "Bulk Email"). The MessageSending listener reads it into the log row. It
     * is stripped again before the correlation id would ever leak — this header
     * is intentionally sent to the recipient (it is just a label).
     */
    public const HEADER = 'X-Mail-Source';
}
