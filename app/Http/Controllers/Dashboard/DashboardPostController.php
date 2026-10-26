<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\PostType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StorePostRequest;
use App\Http\Requests\Dashboard\UpdatePostRequest;
use App\Models\Post;
use App\Models\User;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class DashboardPostController extends Controller
{
    /**
     * Localized fields edited per language through the shared editor.
     *
     * @var list<string>
     */
    private const TRANSLATED = ['title', 'content'];

    /**
     * Non-translatable, language-agnostic parent columns submitted by the form.
     *
     * @var list<string>
     */
    private const PARENT_FIELDS = [
        'user_id',
        'type',
        'visibility',
        'highlighted_student_id',
        'scheduled_at',
        'starts_at',
        'ends_at',
        'job_apply_url',
        'featured',
        'featured_from',
        'featured_until',
    ];

    public function index(): Response
    {
        $posts = Post::query()
            ->with(['author:id,name,role', 'highlightedStudent:id,name', 'translations.language'])
            ->withCount(['comments', 'likes'])
            ->latest()
            ->paginate(20);

        return Inertia::render('dashboard/posts/dashboard-posts-index', [
            'posts' => $posts,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/posts/dashboard-posts-create', [
            'users' => User::query()->select('id', 'name', 'role')->orderBy('name')->limit(200)->get(),
            'postTypes' => PostType::options(),
        ]);
    }

    public function show(Post $post): Response
    {
        $post->load(['author:id,name,role', 'highlightedStudent:id,name', 'translations.language']);

        return Inertia::render('dashboard/posts/dashboard-posts-show', [
            'post' => $post,
        ]);
    }

    public function store(StorePostRequest $request): RedirectResponse
    {
        $post = Post::query()->create([
            ...Arr::only($request->only(self::PARENT_FIELDS), self::PARENT_FIELDS),
            'featured' => (bool) $request->input('featured'),
            'images' => $request->input('images', []),
        ]);

        TranslationPayload::apply($post->translations(), TranslationPayload::extract($request, self::TRANSLATED));

        return redirect()
            ->route('dashboard.posts.index')
            ->with('success', 'flash.postCreated');
    }

    public function edit(Request $request, Post $post): Response
    {
        $this->authorize('update', $post);

        $post->load(['translations.language']);

        return Inertia::render('dashboard/posts/dashboard-posts-edit', [
            'post' => $post,
            'translations' => $this->existingTranslations($post),
            'users' => User::query()->select('id', 'name', 'role')->orderBy('name')->limit(200)->get(),
            'postTypes' => PostType::options(),
        ]);
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        $post->update([
            ...Arr::only($request->only(self::PARENT_FIELDS), self::PARENT_FIELDS),
            'featured' => (bool) $request->input('featured'),
            'images' => $request->input('images', []),
        ]);

        TranslationPayload::apply($post->translations(), TranslationPayload::extract($request, self::TRANSLATED));

        return redirect()
            ->route('dashboard.posts.index')
            ->with('success', 'flash.postUpdated');
    }

    /**
     * The post's current translations keyed by language code, seeded into the
     * shared editor so each tab opens pre-filled on edit.
     *
     * @return array<string, array<string, string>>
     */
    private function existingTranslations(Post $post): array
    {
        return $post->translations
            ->filter(fn ($translation) => $translation->language)
            ->mapWithKeys(fn ($translation): array => [
                $translation->language->code => [
                    'title' => (string) $translation->title,
                    'content' => (string) $translation->content,
                ],
            ])
            ->all();
    }
}
