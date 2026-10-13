<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\SitePage;
use App\Support\Rules\ImageLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Stevebauman\Purify\Facades\Purify;

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

    /**
     * Static in-dashboard guide explaining how editors author site pages
     * (rich text + Word import), linked from the pages list.
     */
    public function help(): Response
    {
        return Inertia::render('dashboard/site-pages/help');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:100', 'unique:site_pages,slug'],
            'title' => ['required', 'string', 'max:255'],
            'hero_image' => ['nullable', new ImageLocation, 'max:2048'],
            'body' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        SitePage::query()->create([
            'slug' => $validated['slug'],
            'title' => $validated['title'],
            'hero_image' => $validated['hero_image'] ?? null,
            // Rich-text body is stored as sanitized HTML inside the content JSON,
            // alongside any legacy structured fields the frontend may still read.
            'content' => ['body' => Purify::clean($validated['body'] ?? '')],
            'is_published' => ! empty($validated['is_published']),
        ]);

        return redirect()
            ->route('dashboard.site-pages.index')
            ->with('success', 'Page created successfully.');
    }

    public function edit(SitePage $sitePage): Response
    {
        $content = is_array($sitePage->content) ? $sitePage->content : [];

        return Inertia::render('dashboard/site-pages/edit', [
            'page' => $sitePage,
            'body' => $content['body'] ?? '',
        ]);
    }

    public function update(Request $request, SitePage $sitePage): RedirectResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:100', 'unique:site_pages,slug,'.$sitePage->id],
            'title' => ['required', 'string', 'max:255'],
            'hero_image' => ['nullable', new ImageLocation, 'max:2048'],
            'body' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        // Preserve any legacy structured keys (vision, goals, ...) while the
        // editor writes the rich-text body.
        $existing = is_array($sitePage->content) ? $sitePage->content : [];

        $sitePage->update([
            'slug' => $validated['slug'],
            'title' => $validated['title'],
            'hero_image' => $validated['hero_image'] ?? null,
            'content' => [...$existing, 'body' => Purify::clean($validated['body'] ?? '')],
            'is_published' => ! empty($validated['is_published']),
        ]);

        return redirect()
            ->route('dashboard.site-pages.index')
            ->with('success', 'Page updated successfully.');
    }
}

