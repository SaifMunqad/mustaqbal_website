<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\SitePage;
use App\Support\Rules\ImageLocation;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;
use Stevebauman\Purify\Facades\Purify;

class DashboardSitePageController extends Controller
{
    /**
     * Localized fields edited per language. Everything else in `content`
     * (video embed + legacy structured sections) stays shared on the parent.
     *
     * @var list<string>
     */
    private const TRANSLATED = ['title', 'body'];

    public function index(): Response
    {
        $pages = SitePage::query()
            ->with('translations.language')
            ->orderBy('slug')
            ->paginate(20);

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
        $request->validate($this->rules());

        $page = SitePage::query()->create([
            'slug' => $request->string('slug')->toString(),
            'hero_image' => $request->input('hero_image'),
            'content' => ['video_embed' => $request->input('video_embed', '')],
            'is_published' => ! empty($request->input('is_published')),
        ]);

        TranslationPayload::apply($page->translations(), $this->cleanedPayload($request));

        return redirect()
            ->route('dashboard.site-pages.index')
            ->with('success', 'Page created successfully.');
    }

    public function edit(SitePage $sitePage): Response
    {
        $sitePage->load(['translations.language']);

        return Inertia::render('dashboard/site-pages/edit', [
            'page' => $sitePage,
            'translations' => $this->existingTranslations($sitePage),
            'videoEmbed' => $sitePage->sharedContent()['video_embed'] ?? '',
        ]);
    }

    public function update(Request $request, SitePage $sitePage): RedirectResponse
    {
        $request->validate($this->rules($sitePage));

        // Preserve the shared, non-localized structured keys while dropping the
        // legacy inline body (the localized translations now own it).
        $shared = Arr::except($sitePage->sharedContent(), ['body']);

        $sitePage->update([
            'slug' => $request->string('slug')->toString(),
            'hero_image' => $request->input('hero_image'),
            'content' => [
                ...$shared,
                'video_embed' => $request->input('video_embed', ''),
            ],
            'is_published' => ! empty($request->input('is_published')),
        ]);

        TranslationPayload::apply($sitePage->translations(), $this->cleanedPayload($request));

        return redirect()
            ->route('dashboard.site-pages.index')
            ->with('success', 'Page updated successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?SitePage $page = null): array
    {
        $slugRule = ['required', 'string', 'max:100'];
        $slugRule[] = $page
            ? 'unique:site_pages,slug,'.$page->id
            : 'unique:site_pages,slug';

        return array_merge([
            'slug' => $slugRule,
            'hero_image' => ['nullable', new ImageLocation, 'max:2048'],
            'video_embed' => ['nullable', 'string', 'max:5000'],
            'is_published' => ['nullable', 'boolean'],
        ], TranslationPayload::rules(self::TRANSLATED, [
            'title' => ['string', 'max:255'],
            'body' => ['string'],
        ], ['title']));
    }

    /**
     * The extracted translation payload with the rich-text body sanitized, so
     * stored HTML is clean for every language.
     *
     * @return array<string, array<string, string>>
     */
    private function cleanedPayload(Request $request): array
    {
        $payload = TranslationPayload::extract($request, self::TRANSLATED);

        foreach ($payload as $code => $fields) {
            if (array_key_exists('body', $fields)) {
                $payload[$code]['body'] = Purify::clean((string) $fields['body']);
            }
        }

        return $payload;
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function existingTranslations(SitePage $page): array
    {
        return $page->translations
            ->filter(fn ($translation) => $translation->language)
            ->mapWithKeys(fn ($translation): array => [
                $translation->language->code => [
                    'title' => (string) $translation->title,
                    'body' => (string) $translation->body,
                ],
            ])
            ->all();
    }
}
