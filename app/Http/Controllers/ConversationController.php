<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreConversationRequest;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $conversations = $request->user()
            ->conversations()
            ->with([
                'participants:id,name,role',
                'messages' => fn ($query) => $query->latest()->limit(1)->with('author:id,name,role'),
            ])
            ->latest('updated_at')
            ->paginate(20);

        return response()->json($conversations);
    }

    public function store(StoreConversationRequest $request): JsonResponse
    {
        $user = $request->user();

        $conversation = DB::transaction(function () use ($request, $user) {
            $conversation = Conversation::query()->create([
                'created_by' => $user->id,
                'topic' => $request->input('topic'),
            ]);

            $participantIds = collect($request->input('participant_ids', []))
                ->push($user->id)
                ->unique()
                ->values()
                ->all();

            $conversation->participants()->sync($participantIds);

            $conversation->messages()->create([
                'user_id' => $user->id,
                'body' => $request->string('message')->toString(),
            ]);

            return $conversation;
        });

        $conversation->load([
            'participants:id,name,role',
            'messages.author:id,name,role',
        ]);

        return response()->json($conversation, 201);
    }
}

