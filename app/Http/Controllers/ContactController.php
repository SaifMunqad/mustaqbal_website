<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Mail\ContactReceivedAcknowledgment;
use App\Models\Message;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Store the inquiry as a message so management/employees can review it
        // in the dashboard "incoming" box. The visitor is anonymous, so the
        // sender details live on the message instead of a user/conversation.
        $message = Message::query()->create([
            'sender_name' => $data['name'],
            'sender_email' => $data['email'],
            'sender_phone' => $data['phone'] ?? null,
            'subject' => $data['subject'] ?? null,
            'body' => $data['message'],
        ]);

        // Auto-acknowledge the visitor so they know we received the inquiry.
        // Queued so a busy SMTP server never delays the form submission.
        Mail::to($message->sender_email)->queue(new ContactReceivedAcknowledgment($message));

        return back()->with('success', 'flash.contactReceived');
    }
}
