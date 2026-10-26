{{--
    Bulk announcement email. The branded shell (DB logo, school name, colours
    and the © footer) lives in the shared <x-mail.layout> component so every
    outgoing message uses the same identity. The body is exactly what the admin
    wrote — nothing is prepended or appended.
--}}
<x-mail.layout :subject="$campaign->subject" :branding="$branding" :direction="$direction">{!! $bodyHtml !!}</x-mail.layout>
