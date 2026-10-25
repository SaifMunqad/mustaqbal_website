<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Models\Post;
use App\Support\Home\PageSections;
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
                    ->with(['author:id,name', 'highlightedStudent:id,name', 'translations.language'])
                    ->latest('featured_from')
                    ->limit($limitPerGroup)
                    ->get();

                $posts = $featured->isNotEmpty()
                    ? $featured
                    : Post::query()
                        ->where('visibility', PostVisibility::Public->value)
                        ->where('type', $type->value)
                        ->with(['author:id,name', 'highlightedStudent:id,name', 'translations.language'])
                        ->latest()
                        ->limit($limitPerGroup)
                        ->get();

                return [
                    'type' => $type->value,
                    'label' => $type->label(),
                    'labelKey' => $type->labelKey(),
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
        // Generous per-category limit so the full recognition roster (e.g. all
        // seeded students/teachers) shows on the dedicated showcase page, with the
        // category tabs keeping it navigable.
        return Inertia::render('school/showcase/school-showcase', [
            'groups' => $this->groups(24),
        ]);
    }

    public function home(): Response
    {
        // The whole layout comes from the page builder: every band the admin can
        // see in the editor is a block, and the editor writes the same store this
        // reads, so the live page can never drift from what was saved.
        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'blocks' => PageSections::render('home'),
        ]);
    }
}
