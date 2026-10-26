@props([
    // Shown as the document <title> and the hidden inbox preview text. Falls
    // back to the school name when a caller has no specific subject.
    'subject' => null,
    // School identity + colours from the site settings. Resolved here when a
    // caller has not already computed it (MailContent::branding()).
    'branding' => null,
    // Text direction. Inferred from the body when not supplied.
    'direction' => null,
])
@php
    $branding ??= \App\Support\Mail\MailContent::branding();
    $body = (string) $slot;
    $direction ??= \App\Support\Mail\MailContent::direction($body);
    $subject = $subject ?: $branding['name'];
    $font = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Naskh Arabic', Arial, sans-serif";
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ $direction }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <title>{{ $subject }}</title>
    <style>
        /* Editor content styling. Inline styles below cover the shell; these
           rules style the author's own markup (headings, lists, tables, …). */
        .mail-body p { margin: 0 0 16px; }
        .mail-body > *:last-child { margin-bottom: 0; }
        .mail-body h1, .mail-body h2, .mail-body h3,
        .mail-body h4, .mail-body h5, .mail-body h6 {
            margin: 0 0 16px;
            font-weight: 700;
            line-height: 1.3;
            color: {{ $branding['ink'] }};
        }
        .mail-body h1 { font-size: 26px; }
        .mail-body h2 { font-size: 22px; }
        .mail-body h3 { font-size: 19px; }
        .mail-body h4, .mail-body h5, .mail-body h6 { font-size: 17px; }
        .mail-body strong, .mail-body b { font-weight: 700; }
        .mail-body a { color: {{ $branding['brand'] }}; text-decoration: underline; }
        .mail-body ul, .mail-body ol { margin: 0 0 16px; padding-inline-start: 22px; }
        .mail-body li { margin-bottom: 6px; }
        .mail-body blockquote {
            margin: 0 0 16px;
            padding-inline-start: 16px;
            border-inline-start: 3px solid {{ $branding['border'] }};
            color: {{ $branding['muted'] }};
        }
        .mail-body img {
            display: block;
            max-width: 100%;
            height: auto;
            margin: 0 auto 16px;
            border: 0;
            border-radius: 16px;
        }
        .mail-body hr {
            margin: 24px 0;
            border: 0;
            border-top: 1px solid {{ $branding['border'] }};
        }
        .mail-body table {
            width: 100%;
            margin: 0 0 16px;
            border-collapse: collapse;
            font-size: 15px;
        }
        .mail-body th, .mail-body td {
            padding: 10px 12px;
            border: 1px solid {{ $branding['border'] }};
            text-align: start;
            vertical-align: top;
        }
        .mail-body th { background-color: {{ $branding['surface'] }}; font-weight: 700; }
        .mail-body code, .mail-body pre {
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 14px;
        }
        .mail-body pre {
            margin: 0 0 16px;
            padding: 12px 14px;
            {{--background-color: {{ $branding['surface'] }};--}}
            border-radius: 12px;
            overflow-x: auto;
        }
        @media only screen and (max-width: 480px) {
            .mail-shell { padding: 24px 8px !important; }
            .mail-brand { padding: 0 8px 18px !important; }
            .mail-logo { max-height: 64px !important; }
            .mail-name { font-size: 20px !important; }
            .mail-content { padding: 22px 20px !important; }
            .mail-footer { padding: 18px 8px 0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f3f5; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    {{-- Inbox preview text: the subject, hidden inside the message. --}}
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
        {{ $subject }}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #f2f3f5;">
        <tr>
            <td class="mail-shell" align="center" style="padding: 32px 12px;">
                {{-- School identity: above the card, centred and prominent. --}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">
                    <tr>
                        <td class="mail-brand" align="center" style="padding: 0 12px 22px;">
                            @if ($branding['logo'])
                                <img class="mail-logo" src="{{ $branding['logo'] }}" alt="{{ $branding['name'] }}"
                                     style="display: inline-block; max-width: 240px; max-height: 88px; width: auto; height: auto; border: 0; outline: none; text-decoration: none;">
                            @endif
                            <div class="mail-name" style="margin-top: {{ $branding['logo'] ? '14px' : '0' }}; font-family: {{ $font }}; font-size: 24px; font-weight: 700; line-height: 1.3; letter-spacing: 0.01em; color: {{ $branding['brand'] }};">
                                {{ $branding['name'] }}
                            </div>
                        </td>
                    </tr>
                </table>

                {{-- Rounded card holding the message body — no greeting or
                     signature is added by the shell itself. --}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                       style="width: 100%; max-width: 600px; background-color: #ffffff; border: 1px solid {{ $branding['border'] }}; border-radius: 24px;">
                    <tr>
                        <td class="mail-content" style="padding: 30px 32px;">
                            <div class="mail-body"
                                 style="font-family: {{ $font }}; font-size: 16px; line-height: 1.75; color: {{ $branding['ink'] }}; text-align: start;">
                                {!! $body !!}
                            </div>
                        </td>
                    </tr>
                </table>

                {{-- Copyright below the card: this year plus the school name from the site settings. --}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">
                    <tr>
                        <td class="mail-footer" align="center" style="padding: 22px 12px 0; font-family: {{ $font }}; font-size: 13px; line-height: 1.6; color: {{ $branding['muted'] }};">
                            &copy; {{ date('Y') }} {{ $branding['name'] }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
