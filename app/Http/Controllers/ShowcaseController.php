<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Models\Post;
use App\Support\Home\HomeSections;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class ShowcaseController extends Controller
{
    /**
     * Recognition highlights grouped by type (students, teacher, employee).
     *
     * Featured posts come first; the newest public post of each recognition
     * type is used as a fallback so the showcase is never empty once content
     * exists.
     *
     * @return list<array<string, mixed>>
     */
    private function groups(int $limitPerGroup = 4): array
    {
        return collect(PostType::recognitionTypes())
            ->map(function (PostType $type) use ($limitPerGroup): array {
                $featured = Post::query()
                    ->featuredCurrently()
                    ->where('visibility', PostVisibility::Public->value)
                    ->where('type', $type->value)
                    ->with(['author:id,name', 'highlightedStudent:id,name'])
                    ->latest('featured_from')
                    ->limit($limitPerGroup)
                    ->get();

                $posts = $featured->isNotEmpty()
                    ? $featured
                    : Post::query()
                        ->where('visibility', PostVisibility::Public->value)
                        ->where('type', $type->value)
                        ->with(['author:id,name', 'highlightedStudent:id,name'])
                        ->latest()
                        ->limit($limitPerGroup)
                        ->get();

                return [
                    'type' => $type->value,
                    'label' => $type->label(),
                    'posts' => $posts->map(fn (Post $post): array => [
                        'id' => $post->id,
                        'title' => $post->title,
                        'excerpt' => str($post->content)->limit(140)->toString(),
                        'images' => $post->images,
                        'honoree' => $post->highlightedStudent?->name ?? $post->author?->name,
                        'created_at' => $post->created_at?->toDateString(),
                    ])->values()->all(),
                ];
            })
            ->filter(fn (array $group): bool => $group['posts'] !== [])
            ->values()
            ->all();
    }

    public function index(): Response
    {
        return Inertia::render('school/showcase/index', [
            'groups' => $this->groups(8),
        ]);
    }

    public function home(): Response
    {
        // Admin-curated layout when configured; otherwise fall back to the
        // legacy recognition showcase so the home page is never empty and the
        // feature degrades gracefully if home_sections isn't migrated yet.
        $sections = HomeSections::render();

        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'sections' => $sections,
            'showcase' => $sections === [] ? $this->groups(3) : [],
        ]);
    }
}
