@component('mail::message')
Dear {{ $name ?: 'Visitor' }},

Thank you for reaching out to us. We have received your message and our team will get back to you as soon as possible.
@if ($subject)

**Subject:** {{ $subject }}
@endif

We appreciate you taking the time to contact us.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
