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
    public function index(): Response
    {
        $messages = Message::query()
            ->with(['conversation:id,topic', 'author:id,name,role'])
            ->latest()
            ->paginate(20);

        return Inertia::render('dashboard/messages/index', [
            'messages' => $messages,
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
            ->with('toast', ['variant' => 'success', 'title' => 'Message created successfully.']);
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
            ->with('toast', ['variant' => 'success', 'title' => 'Message updated successfully.']);
    }
}

