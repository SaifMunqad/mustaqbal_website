<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Mail\ContactAnswerReply;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class DashboardMessageController extends Controller
{
    public function index(Request $request): Response
    {
        $box = in_array($request->query('box'), ['incoming', 'sent'], true)
            ? $request->query('box')
            : 'incoming';

        $messages = Message::query()
            ->with(['conversation:id,topic', 'author:id,name,role', 'answers' => fn ($query) => $query->latest()->limit(1)->with('author:id,name')])
            ->when(
                $box === 'sent',
                fn ($query) => $query->where('user_id', $request->user()->id),
                // Incoming = everything the current user did not author,
                // including anonymous contact-form messages (null user_id).
                fn ($query) => $query->where(
                    fn ($q) => $q->whereNull('user_id')->orWhere('user_id', '!=', $request->user()->id),
                ),
            )
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('dashboard/messages/index', [
            'messages' => $messages,
            'box' => $box,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/messages/create', [
            'conversations' => Conversation::query()->select('id', 'topic')->latest()->limit(200)->get(),
            'users' => User::query()->select('id', 'name', 'role')->orderBy('name')->limit(200)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'conversation_id' => ['required', 'exists:conversations,id'],
            'user_id' => ['required', 'exists:users,id'],
            'body' => ['required', 'string', 'max:2000'],
            'read_at' => ['nullable', 'date'],
        ]);

        Message::query()->create($validated);

        return redirect()
            ->route('dashboard.messages.index')
            ->with('success', 'Message created successfully.');
    }

    public function edit(Message $message): Response
    {
        return Inertia::render('dashboard/messages/edit', [
            'message' => $message,
            'conversations' => Conversation::query()->select('id', 'topic')->latest()->limit(200)->get(),
            'users' => User::query()->select('id', 'name', 'role')->orderBy('name')->limit(200)->get(),
        ]);
    }

    /**
     * Answer thread for a contact inquiry: shows the original message and every
     * recorded reply so management can read the history and add another answer.
     */
    public function show(Message $message): Response
    {
        $message->load([
            'answers' => fn ($query) => $query->latest()->with('author:id,name,role'),
        ]);

        return Inertia::render('dashboard/messages/show', [
            'message' => $message,
        ]);
    }

    /**
     * Record a reply against a contact inquiry and email it back to the visitor.
     */
    public function storeAnswer(Request $request, Message $message): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $answer = $message->answers()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
            'answered_at' => now(),
        ]);

        // Notify the original sender of the reply. Queued so a busy SMTP
        // server never delays the dashboard action.
        if ($message->sender_email) {
            Mail::to($message->sender_email)->queue(new ContactAnswerReply($message, $answer));
        }

        return redirect()
            ->route('dashboard.messages.show', $message)
            ->with('success', 'Answer recorded and emailed to the sender.');
    }

    public function update(Request $request, Message $message): RedirectResponse
    {
        $validated = $request->validate([
            'conversation_id' => ['required', 'exists:conversations,id'],
            'user_id' => ['required', 'exists:users,id'],
            'body' => ['required', 'string', 'max:2000'],
            'read_at' => ['nullable', 'date'],
        ]);

        $message->update($validated);

        return redirect()
            ->route('dashboard.messages.index')
            ->with('success', 'Message updated successfully.');
    }
}

