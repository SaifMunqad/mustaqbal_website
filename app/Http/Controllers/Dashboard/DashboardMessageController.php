<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            ->with(['conversation:id,topic', 'author:id,name,role'])
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

