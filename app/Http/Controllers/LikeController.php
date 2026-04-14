<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function store(Request $request, Post $post): JsonResponse
    {
        $this->authorize('interact', $post);

        $post->likes()->firstOrCreate([
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'likes_count' => $post->likes()->count(),
        ]);
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        $this->authorize('interact', $post);

        $post->likes()->where('user_id', $request->user()->id)->delete();

        return response()->json([
            'likes_count' => $post->likes()->count(),
        ]);
    }
}

