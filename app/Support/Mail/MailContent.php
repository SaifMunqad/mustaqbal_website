<?php

namespace App\Support\Mail;

use App\Models\EmailCampaign;
use App\Models\SiteSetting;

/**
 * Prepares the DB-driven pieces shared by the campaign emails.
 *
 * Two problems are solved here:
 *
 *  1. Branding must come from the school's own settings (name, logo, brand
 *     colour), never from a hard-coded app name or logo.
 *  2. Email clients have no page context, so app-relative asset paths such as
 *     "/storage/uploads/x.jpg" (what the dashboard uploader returns) must be
 *     turned into absolute URLs, otherwise inline images render broken.
 */
final class MailContent
{
    /**
     * School identity + contrast-clamped colours for the email shell.
     *
     * @return array{name: string, logo: string|null, brand: string, ink: string, muted: string, border: string, surface: string}
     */
    public static function branding(?string $languageCode = null): array
    {
        $settings = SiteSetting::current();
        $palette = $settings->palette()['light'];

        return [
            'name' => (string) ($settings->translated('brand_name', $languageCode) ?: config('mail.from.name') ?: config('app.name')),
            'logo' => self::absolute($settings->logo_url),
            'brand' => $palette['--brand'],
            'ink' => $palette['--ink'],
            'muted' => $palette['--ink-muted'],
            'border' => $palette['--brand-border'],
            'surface' => $palette['--brand-soft'],
        ];
    }

    /**
     * The campaign body as email-ready HTML: sanitized rich text with absolute
     * asset URLs, or the author's line breaks when the campaign predates the
     * rich-text editor.
     */
    public static function html(EmailCampaign $campaign): string
    {
        $html = $campaign->bodyHtml();

        // Empty paragraphs left behind by the editor add dead vertical space in
        // mail clients that honour them.
        $html = preg_replace('#<p>(?:\s|&nbsp;|<br\s*/?>)*</p>#i', '', $html) ?? $html;

        return self::absolutize($html);
    }

    /**
     * Text direction inferred from the body, so right-to-left announcements
     * render correctly regardless of the dashboard's own language.
     */
    public static function direction(string $html): string
    {
        $semitic = '/[\x{0590}-\x{05FF}\x{0600}-\x{06FF}\x{0750}-\x{077F}\x{08A0}-\x{08FF}\x{FB1D}-\x{FDFF}\x{FE70}-\x{FEFF}]/u';

        return preg_match($semitic, $html) === 1 ? 'rtl' : 'ltr';
    }

    /**
     * Rewrite app-relative href/src values ("/storage/x.jpg") to absolute ones.
     * Protocol-relative ("//cdn…") and data: URLs are already usable as-is.
     */
    private static function absolutize(string $html): string
    {
        $pattern = '#\b(src|href)=(["\'])(/(?!/)[^"\']*)\2#i';

        return preg_replace_callback(
            $pattern,
            static fn (array $matches): string => $matches[1].'='.$matches[2].self::baseUrl().'/'.ltrim($matches[3], '/').$matches[2],
            $html,
        ) ?? $html;
    }

    private static function absolute(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        if (str_starts_with($value, 'data:') || preg_match('#^(https?:)?//#i', $value) === 1) {
            return $value;
        }

        return self::baseUrl().'/'.ltrim($value, '/');
    }

    /**
     * Emails are rendered by a queue worker, where no HTTP request exists, so
     * `url()` would resolve to the worker's fallback root. APP_URL is the only
     * host that is correct for a message read outside the site.
     */
    private static function baseUrl(): string
    {
        return rtrim((string) config('app.url'), '/');
    }
}
