<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\PostType;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Support\Rules\ImageLocation;
use App\Models\User;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
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

        return Inertia::render('dashboard/posts/index', [
            'posts' => $posts,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/posts/create', [
            'users' => User::query()->select('id', 'name', 'role')->orderBy('name')->limit(200)->get(),
            'postTypes' => PostType::options(),
        ]);
    }

    public function show(Post $post): Response
    {
        $post->load(['author:id,name,role', 'highlightedStudent:id,name', 'translations.language']);

        return Inertia::render('dashboard/posts/show', [
            'post' => $post,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', [Post::class, (string) $request->input('type')]);

        $this->mergeImages($request);

        $request->validate($this->rules());

        $post = Post::query()->create([
            ...Arr::only($request->only(self::PARENT_FIELDS), self::PARENT_FIELDS),
            'featured' => (bool) $request->input('featured'),
            'images' => $request->input('images', []),
        ]);

        TranslationPayload::apply($post->translations(), TranslationPayload::extract($request, self::TRANSLATED));

        return redirect()
            ->route('dashboard.posts.index')
            ->with('success', 'Post created successfully.');
    }

    public function edit(Request $request, Post $post): Response
    {
        $this->authorize('update', $post);

        $post->load(['translations.language']);

        return Inertia::render('dashboard/posts/edit', [
            'post' => $post,
            'translations' => $this->existingTranslations($post),
            'users' => User::query()->select('id', 'name', 'role')->orderBy('name')->limit(200)->get(),
            'postTypes' => PostType::options(),
        ]);
    }

    public function update(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('update', $post);

        $this->mergeImages($request);

        $request->validate($this->rules());

        $post->update([
            ...Arr::only($request->only(self::PARENT_FIELDS), self::PARENT_FIELDS),
            'featured' => (bool) $request->input('featured'),
            'images' => $request->input('images', []),
        ]);

        TranslationPayload::apply($post->translations(), TranslationPayload::extract($request, self::TRANSLATED));

        return redirect()
            ->route('dashboard.posts.index')
            ->with('success', 'Post updated successfully.');
    }

    /**
     * Validation rules for the parent fields plus every active language's
     * localized title/content (the default language is required).
     *
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return array_merge([
            'user_id' => ['required', 'exists:users,id'],
            'type' => ['required', Rule::enum(PostType::class)],
            'visibility' => ['required', 'in:public,community'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', new ImageLocation, 'max:2048'],
            'highlighted_student_id' => ['nullable', 'exists:users,id'],
            'scheduled_at' => ['nullable', 'date'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'job_apply_url' => ['nullable', 'url', 'max:2048'],
            'featured' => ['nullable', 'boolean'],
            'featured_from' => ['nullable', 'date'],
            'featured_until' => ['nullable', 'date', 'after_or_equal:featured_from'],
        ], TranslationPayload::rules(self::TRANSLATED, [
            'title' => ['string', 'max:255'],
            'content' => ['string'],
        ]));
    }

    private function mergeImages(Request $request): void
    {
        $images = $request->input('images', []);

        if (is_array($images)) {
            $request->merge([
                'images' => array_values(array_filter($images, static fn ($image) => filled($image))),
            ]);
        }
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
