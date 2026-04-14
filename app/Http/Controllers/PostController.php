<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Http\Requests\StorePostRequest;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = Post::query()
            ->visibleTo($request->user())
            ->with([
                'author:id,name,role',
                'highlightedStudent:id,name',
                'comments.author:id,name',
                'likes.user:id,name',
            ])
            ->withCount(['comments', 'likes'])
            ->latest()
            ->paginate(12);

        return response()->json($posts);
    }

    public function show(Request $request, Post $post): JsonResponse
    {
        abort_unless($request->user() || $post->visibility === PostVisibility::Public, 403);

        $post->load([
            'author:id,name,role',
            'highlightedStudent:id,name',
            'comments.author:id,name,role',
            'likes.user:id,name',
        ])->loadCount(['comments', 'likes']);

        return response()->json($post);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $type = $request->string('type')->toString();
        $this->authorize('create', [Post::class, $type]);

        $postType = PostType::from($type);
        $defaultVisibility = $postType->isManagementOwned()
            ? PostVisibility::Public->value
            : PostVisibility::Community->value;

        $validated = $request->validated();
        $images = array_values(array_filter($validated['images'] ?? [], static fn ($image) => filled($image)));

        $post = Post::query()->create([
            ...$validated,
            'user_id' => $request->user()->id,
            'visibility' => $request->input('visibility', $defaultVisibility),
            'images' => $images,
        ]);

        $post->load(['author:id,name,role', 'highlightedStudent:id,name'])
            ->loadCount(['comments', 'likes']);

        return response()->json($post, 201);
    }
}


