{{--
    Contact acknowledgment email. The branded shell (DB logo, school name,
    colours and the © footer) comes from the shared <x-mail.layout> component so
    this auto-reply matches the identity of every other outgoing email.
--}}
@php
    $paragraphs = [
        '<p>Dear '.e($name ?: 'Visitor').',</p>',
        '<p>Thank you for reaching out to us. We have received your message and our team will get back to you as soon as possible.</p>',
    ];

    if (! blank($subject ?? null)) {
        $paragraphs[] = '<p><strong>Subject:</strong> '.e($subject).'</p>';
    }

    $paragraphs[] = '<p>We appreciate you taking the time to contact us.</p>';
@endphp
<x-mail.layout :subject="'We received your message'">{!! implode('', $paragraphs) !!}</x-mail.layout>
