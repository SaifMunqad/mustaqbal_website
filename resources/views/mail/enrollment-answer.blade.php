{{--
    Enrollment reply email. The branded shell (DB logo, school name, colours
    and the © footer) comes from the shared <x-mail.layout> component. The body
    is exactly what the admin composed — nothing is prepended or appended.
--}}
<x-mail.layout :subject="$subject" :branding="$branding" :direction="$direction">{!! $bodyHtml !!}</x-mail.layout>
