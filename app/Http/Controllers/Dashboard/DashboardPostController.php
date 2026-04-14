<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardPostController extends Controller
{
    public function index(): Response
    {
        $posts = Post::query()
            ->with(['author:id,name,role', 'highlightedStudent:id,name'])
            ->withCount(['comments', 'likes'])
            ->latest()
            ->paginate(20);

        return Inertia::render('dashboard/posts/index', [
            'posts' => $posts,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/posts/create', [
            'users' => User::query()->select('id', 'name', 'role')->orderBy('name')->limit(200)->get(),
        ]);
    }

    public function show(Post $post): Response
    {
        $post->load(['author:id,name,role', 'highlightedStudent:id,name']);

        return Inertia::render('dashboard/posts/show', [
            'post' => $post,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'images' => array_values(array_filter($request->input('images', []), static fn ($image) => filled($image))),
        ]);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'type' => ['required', 'in:news,job,event,achievement,student_of_week,student_of_month'],
            'visibility' => ['required', 'in:public,community'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', 'url', 'max:2048'],
            'highlighted_student_id' => ['nullable', 'exists:users,id'],
            'scheduled_at' => ['nullable', 'date'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'job_apply_url' => ['nullable', 'url', 'max:2048'],
        ]);

        $images = array_values(array_filter($validated['images'] ?? [], static fn ($image) => filled($image)));

        Post::query()->create([
            ...$validated,
            'images' => $images,
        ]);

        return redirect()
            ->route('dashboard.posts.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Post created successfully.']);
    }

    public function edit(Post $post): Response
    {
        return Inertia::render('dashboard/posts/edit', [
            'post' => $post,
            'users' => User::query()->select('id', 'name', 'role')->orderBy('name')->limit(200)->get(),
        ]);
    }

    public function update(Request $request, Post $post): RedirectResponse
    {
        $request->merge([
            'images' => array_values(array_filter($request->input('images', []), static fn ($image) => filled($image))),
        ]);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'type' => ['required', 'in:news,job,event,achievement,student_of_week,student_of_month'],
            'visibility' => ['required', 'in:public,community'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', 'url', 'max:2048'],
            'highlighted_student_id' => ['nullable', 'exists:users,id'],
            'scheduled_at' => ['nullable', 'date'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'job_apply_url' => ['nullable', 'url', 'max:2048'],
        ]);

        $images = array_values(array_filter($validated['images'] ?? [], static fn ($image) => filled($image)));

        $post->update([
            ...$validated,
            'images' => $images,
        ]);

        return redirect()
            ->route('dashboard.posts.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Post updated successfully.']);
    }
}

