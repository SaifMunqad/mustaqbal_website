<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardArticleController extends Controller
{
    public function index(): Response
    {
        $articles = Article::query()
            ->with('author:id,name')
            ->latest()
            ->paginate(15);

        return Inertia::render('dashboard/articles/index', [
            'articles' => $articles,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/articles/create');
    }

    public function show(Article $article): Response
    {
        $article->load('author:id,name');

        return Inertia::render('dashboard/articles/show', [
            'article' => $article,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'images' => array_values(array_filter($request->input('images', []), static fn ($image) => filled($image))),
        ]);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'body' => ['required', 'string'],
            'cover_image' => ['nullable', 'url', 'max:2048'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', 'url', 'max:2048'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $images = array_values(array_filter($validated['images'] ?? [], static fn ($image) => filled($image)));

        Article::query()->create([
            ...$validated,
            'images' => $images,
            'slug' => Str::slug($validated['title']).'-'.Str::lower(Str::random(4)),
            'user_id' => $request->user()->id,
            'published_at' => ! empty($validated['is_published']) ? now() : null,
            'is_published' => ! empty($validated['is_published']),
        ]);

        return redirect()
            ->route('dashboard.articles.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Article created successfully.']);
    }

    public function edit(Article $article): Response
    {
        return Inertia::render('dashboard/articles/edit', [
            'article' => $article,
        ]);
    }

    public function update(Request $request, Article $article): RedirectResponse
    {
        $request->merge([
            'images' => array_values(array_filter($request->input('images', []), static fn ($image) => filled($image))),
        ]);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'body' => ['required', 'string'],
            'cover_image' => ['nullable', 'url', 'max:2048'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', 'url', 'max:2048'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $images = array_values(array_filter($validated['images'] ?? [], static fn ($image) => filled($image)));

        $article->update([
            ...$validated,
            'images' => $images,
            'published_at' => ! empty($validated['is_published'])
                ? ($article->published_at ?? now())
                : null,
            'is_published' => ! empty($validated['is_published']),
        ]);

        return redirect()
            ->route('dashboard.articles.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Article updated successfully.']);
    }
}

