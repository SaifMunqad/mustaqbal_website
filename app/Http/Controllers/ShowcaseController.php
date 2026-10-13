<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Models\Job;
use App\Models\Post;
use App\Models\Program;
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

    /**
     * Top programs for the home-page highlight, resolved in the current locale.
     * Mirrors SchoolPageController::programs so names/descriptions follow the
     * active language. Degrades to an empty list if the table isn't ready.
     *
     * @return list<array<string, mixed>>
     */
    private function featuredPrograms(int $limit = 4): array
    {
        $locale = app()->getLocale();

        try {
            return Program::query()
                ->with(['translations.language', 'typeTranslations.language'])
                ->orderBy('display_order')
                ->orderBy('name')
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
     * Latest active job postings for the home-page "latest jobs" block.
     * Reuses the same ordering/visibility rules as the public jobs listing and
     * the shared card payload, so a home card always matches its listing view.
     *
     * @return list<array<string, mixed>>
     */
    private function featuredJobs(int $limit = 3): array
    {
        try {
            return Job::query()
                ->active()
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

        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'sections' => $sections,
            'showcase' => $sections === [] ? $this->groups(3) : [],
            'programs' => $this->featuredPrograms(4),
            'jobs' => $this->featuredJobs(3),
        ]);
    }
}
