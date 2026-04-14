<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\SitePage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardSitePageController extends Controller
{
    public function index(): Response
    {
        $pages = SitePage::query()->orderBy('slug')->paginate(20);

        return Inertia::render('dashboard/site-pages/index', [
            'pages' => $pages,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/site-pages/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:100', 'unique:site_pages,slug'],
            'title' => ['required', 'string', 'max:255'],
            'hero_image' => ['nullable', 'url', 'max:2048'],
            'content' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $decoded = json_decode($validated['content'] ?? '[]', true);

        SitePage::query()->create([
            'slug' => $validated['slug'],
            'title' => $validated['title'],
            'hero_image' => $validated['hero_image'] ?? null,
            'content' => is_array($decoded) ? $decoded : [],
            'is_published' => ! empty($validated['is_published']),
        ]);

        return redirect()
            ->route('dashboard.site-pages.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Page created successfully.']);
    }

    public function edit(SitePage $sitePage): Response
    {
        return Inertia::render('dashboard/site-pages/edit', [
            'page' => $sitePage,
            'contentJson' => json_encode($sitePage->content ?? [], JSON_PRETTY_PRINT),
        ]);
    }

    public function update(Request $request, SitePage $sitePage): RedirectResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:100', 'unique:site_pages,slug,'.$sitePage->id],
            'title' => ['required', 'string', 'max:255'],
            'hero_image' => ['nullable', 'url', 'max:2048'],
            'content' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $decoded = json_decode($validated['content'] ?? '[]', true);

        $sitePage->update([
            'slug' => $validated['slug'],
            'title' => $validated['title'],
            'hero_image' => $validated['hero_image'] ?? null,
            'content' => is_array($decoded) ? $decoded : [],
            'is_published' => ! empty($validated['is_published']),
        ]);

        return redirect()
            ->route('dashboard.site-pages.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Page updated successfully.']);
    }
}

