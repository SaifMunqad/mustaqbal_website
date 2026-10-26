{{--
    Contact reply email. The branded shell (DB logo, school name, colours and
    the © footer) comes from the shared <x-mail.layout> component, so this
    message carries the same identity as every other outgoing email. The reply
    text is rendered as safe paragraphs inside the card.
--}}
@php
    $paragraphs = [
        '<p>Dear '.e($name ?: 'Visitor').',</p>',
        '<p>Thank you for contacting us. Here is our response to your message:</p>',
        '<blockquote>'.nl2br(e($answerBody)).'</blockquote>',
    ];

    if ($answeredAt) {
        $paragraphs[] = '<p>Responded on '.e($answeredAt->format('F j, Y')).'.</p>';
    }

    $paragraphs[] = '<p>You can reply to this email if you have any further questions.</p>';
@endphp
<x-mail.layout :subject="'Our response to your message'">{!! implode('', $paragraphs) !!}</x-mail.layout>
