@component('mail::message')
Dear {{ $name ?: 'Visitor' }},

Thank you for contacting us. Here is our response to your message:

@component('mail::panel')
{!! nl2br(e($answerBody)) !!}
@endcomponent
@if ($answeredAt)

Responded on {{ $answeredAt->format('F j, Y') }}
@endif

You can reply to this email if you have any further questions.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
