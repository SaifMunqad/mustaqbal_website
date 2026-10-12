<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Models\Message;
use Illuminate\Http\RedirectResponse;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Store the inquiry as a message so management/employees can review it
        // in the dashboard "incoming" box. The visitor is anonymous, so the
        // sender details live on the message instead of a user/conversation.
        Message::query()->create([
            'sender_name' => $data['name'],
            'sender_email' => $data['email'],
            'sender_phone' => $data['phone'] ?? null,
            'subject' => $data['subject'] ?? null,
            'body' => $data['message'],
        ]);

        return back()->with('success', 'Your message has been sent. We will get back to you soon.');
    }
}
