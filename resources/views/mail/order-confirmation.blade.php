@component('mail::message')
# Thank you for your order, {{ $order->customer_name }}!

We have received your book order **{{ $order->order_number }}** and it is now
being processed. Our team will contact you to confirm {{ $order->payment_method === \App\Enums\PaymentMethod::CashOnDelivery ? 'cash on delivery' : 'your bank transfer' }}.

@component('mail::table')
| Book | Qty | Price | Total |
| --- | ---: | ---: | ---: |
@foreach ($order->items as $item)
| {{ $item->title }} | {{ $item->quantity }} | {{ number_format($item->unit_price, 2) }} AFN | {{ number_format($item->line_total, 2) }} AFN |
@endforeach
@endcomponent

**Order total: {{ number_format($order->total, 2) }} AFN**

If you have any questions, just reply to this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
