<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Program;
use App\Models\SitePage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DashboardContentController extends Controller
{
    public function storeArticle(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'body' => ['required', 'string'],
            'cover_image' => ['nullable', 'url', 'max:2048'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        Article::query()->create([
            ...$validated,
            'slug' => Str::slug($validated['title']).'-'.Str::lower(Str::random(4)),
            'user_id' => $request->user()->id,
            'published_at' => ! empty($validated['is_published']) ? now() : null,
            'is_published' => ! empty($validated['is_published']),
        ]);

        return back()->with('toast', ['variant' => 'success', 'title' => 'Article saved successfully.']);
    }

    public function storeProgram(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'program_type' => ['required', 'in:school,courses,islamic_madrasa'],
            'description' => ['required', 'string'],
            'schedule' => ['required', 'string', 'max:255'],
            'fees' => ['required', 'numeric', 'min:0'],
            'age_recommendation' => ['required', 'string', 'max:255'],
            'classroom_number' => ['nullable', 'string', 'max:100'],
            'available_for_enroll' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $program = Program::query()->create([
            ...$validated,
            'available_for_enroll' => ! empty($validated['available_for_enroll']),
            'display_order' => $validated['display_order'] ?? 0,
        ]);

        $program->syncDefaultTranslation();

        return back()->with('toast', ['variant' => 'success', 'title' => 'Program saved successfully.']);
    }

    public function upsertPage(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'in:about,programs,contact'],
            'title' => ['required', 'string', 'max:255'],
            'hero_image' => ['nullable', 'url', 'max:2048'],
            'content' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $content = [];
        if (! empty($validated['content'])) {
            $decoded = json_decode($validated['content'], true);
            $content = is_array($decoded) ? $decoded : [];
        }

        SitePage::query()->updateOrCreate(
            ['slug' => $validated['slug']],
            [
                'title' => $validated['title'],
                'hero_image' => $validated['hero_image'] ?? null,
                'content' => $content,
                'is_published' => ! empty($validated['is_published']),
            ],
        );

        return back()->with('toast', ['variant' => 'success', 'title' => 'Page saved successfully.']);
    }
}


