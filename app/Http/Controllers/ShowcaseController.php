<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Models\Job;
use App\Models\Post;
use App\Models\Program;
use App\Support\Home\HomeSections;
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
        return Inertia::render('school/showcase/index', [
            'groups' => $this->groups(24),
        ]);
    }

    /**
     * Programs for the home-page highlight, resolved in the current locale.
     * Mirrors SchoolPageController::programs so names/descriptions follow the
     * active language. Picks a small random sample so the home page surfaces
     * variety rather than always the same top entries. Degrades to an empty
     * list if the table isn't ready.
     *
     * @return list<array<string, mixed>>
     */
    private function featuredPrograms(int $limit = 2): array
    {
        $locale = app()->getLocale();

        try {
            return Program::query()
                ->with(['translations.language', 'typeTranslations.language'])
                ->inRandomOrder()
                ->limit($limit)
                ->get()
                ->map(fn (Program $program): array => [
                    'id' => $program->id,
                    'name' => $program->translatedName($locale),
                    'program_type' => $program->program_type,
                    'program_type_label' => $program->translatedProgramType($locale),
                    'description' => $program->translatedDescription($locale),
                    'schedule' => $program->schedule,
                    'fees' => $program->fees,
                    'age_recommendation' => $program->age_recommendation,
                    'classroom_number' => $program->classroom_number,
                    'available_for_enroll' => $program->available_for_enroll,
                ])
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Active job postings for the home-page "latest jobs" block. Shows a small
     * random sample (max 2) of the open positions, reusing the same visibility
     * rules as the public jobs listing and the shared card payload, so a home
     * card always matches its listing view.
     *
     * @return list<array<string, mixed>>
     */
    private function featuredJobs(int $limit = 2): array
    {
        try {
            return Job::query()
                ->with('translations.language')
                ->active()
                ->reorder()
                ->inRandomOrder()
                ->limit($limit)
                ->get()
                ->map(fn (Job $job): array => $job->toCard())
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    public function home(): Response
    {
        // Admin-curated layout when configured; otherwise fall back to the
        // legacy recognition showcase so the home page is never empty and the
        // feature degrades gracefully if home_sections isn't migrated yet.
        $sections = HomeSections::render();

        // Dual-read: when the normalized page builder is enabled for the home
        // page and it has content, the frontend renders `blocks` through the
        // shared responsive grid instead of the legacy fixed-slot stack.
        $blocks = config('builder.home_enabled')
            ? PageSections::render('home')
            : [];

        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'blocks' => $blocks,
            'sections' => $sections,
            'showcase' => $sections === [] ? $this->groups(3) : [],
            'programs' => $this->featuredPrograms(2),
            'jobs' => $this->featuredJobs(2),
        ]);
    }
}
