@component('mail::message')
Dear {{ $recipient->name ?: 'Parent / Guardian' }},

{!! nl2br(e($campaign->body)) !!}

Thanks,<br>
{{ config('app.name') }}
@endcomponent
