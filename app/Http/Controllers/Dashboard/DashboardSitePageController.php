<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Language;
use App\Models\SitePage;
use App\Support\Rules\ImageLocation;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'contents' => $this->localizedContents($sitePage),
            'videoEmbed' => $sitePage->sharedContent()['video_embed'] ?? '',
        ]);
    }

    /**
     * Visual (WYSIWYG) editor for a site page. Renders the real page as a live
     * canvas and lets an admin edit each block, in any language, then commit
     * through the same update() path. Currently meaningful for structured pages
     * like About; simple pages still get the title/body preview.
     */
    public function visual(SitePage $sitePage): Response
    {
        $sitePage->load(['translations.language']);

        return Inertia::render('dashboard/site-pages/visual', [
            'page' => $sitePage,
            'translations' => $this->existingTranslations($sitePage),
            'contents' => $this->localizedContents($sitePage),
            'videoEmbed' => $sitePage->sharedContent()['video_embed'] ?? '',
        ]);
    }

    public function update(Request $request, SitePage $sitePage): RedirectResponse
    {
        $request->validate($this->rules($sitePage));

        // The parent keeps only the shared, non-localized keys plus the default
        // language's structured sections, which act as the universal fallback for
        // any language that has not been translated yet.
        $default = Language::defaultCode();
        $sections = (array) $request->input('contents', []);
        $parentContent = [
            'video_embed' => $request->input('video_embed', ''),
            ...$this->sanitizeSections($sections[$default] ?? []),
        ];

        $sitePage->update([
            'slug' => $request->string('slug')->toString(),
            'hero_image' => $request->input('hero_image'),
            'content' => $parentContent,
            'is_published' => ! empty($request->input('is_published')),
        ]);

        // Localized title + rich-text body per language.
        TranslationPayload::apply($sitePage->translations(), $this->cleanedPayload($request));

        // Structured sections for every non-default language become overrides on
        // that language's translation row. Empty sections store null so the site
        // falls back to the default parent copy rather than rendering nothing.
        $languages = Language::query()
            ->whereIn('code', array_keys($sections))
            ->get()
            ->keyBy('code');

        foreach ($sections as $code => $obj) {
            if ($code === $default || ! is_array($obj)) {
                continue;
            }

            $language = $languages->get($code);

            if (! $language) {
                continue;
            }

            $clean = $this->sanitizeSections($obj);

            $row = $sitePage->translations()->where('language_id', $language->id)->first();

            // Blank sections must NOT create a content-less row; just clear an
            // existing override so the site falls back to the default copy.
            if ($clean === []) {
                if ($row) {
                    $row->content = null;
                    $row->save();
                }

                continue;
            }

            // Create with an empty title default so the NOT NULL column is
            // satisfied; title/body remain owned by the translations payload.
            $row ??= $sitePage->translations()->create(['language_id' => $language->id, 'title' => '']);
            $row->content = $clean;
            $row->save();
        }

        return redirect()
            ->route('dashboard.site-pages.index')
            ->with('success', 'Page updated successfully.');
    }

    /**
     * The raw, per-language structured sections for the editor. The default
     * language reads the parent (source of truth); other languages read only
     * their own row (blank when untranslated), keeping editing fallback-free.
     *
     * @return array<string, array<string, mixed>>
     */
    private function localizedContents(SitePage $page): array
    {
        $default = Language::defaultCode();
        $rows = $page->translations
            ->filter(fn ($translation) => $translation->language)
            ->keyBy(fn ($translation): string => $translation->language->code);

        $contents = [];

        foreach (Language::activeList() as $meta) {
            $code = $meta['code'];

            if ($code === $default) {
                $shared = $page->sharedContent();
                $contents[$code] = array_intersect_key($shared, array_flip(SitePage::SECTION_KEYS));

                continue;
            }

            $content = $rows->get($code)?->content;
            $contents[$code] = is_array($content) ? $content : [];
        }

        return $contents;
    }

    /**
     * Whitelist + coerce the editable About sections. Drops blank scalars and
     * empty list rows so partially-empty editor rows never persist as noise.
     *
     * @param  array<string, mixed>  $obj
     * @return array<string, mixed>
     */
    private function sanitizeSections(array $obj): array
    {
        $out = [];

        foreach (['intro', 'mission', 'vision'] as $field) {
            $value = $obj[$field] ?? null;
            if (is_string($value) && trim($value) !== '') {
                $out[$field] = trim($value);
            }
        }

        if (isset($obj['stats']) && is_array($obj['stats'])) {
            $out['stats'] = collect($obj['stats'])
                ->map(fn (array $r): array => ['value' => trim((string) ($r['value'] ?? '')), 'label' => trim((string) ($r['label'] ?? ''))])
                ->filter(fn (array $r): bool => $r['value'] !== '' || $r['label'] !== '')
                ->values()
                ->all();
        }

        if (isset($obj['values']) && is_array($obj['values'])) {
            $out['values'] = collect($obj['values'])
                ->map(fn (array $r): array => ['icon' => (string) ($r['icon'] ?? ''), 'title' => trim((string) ($r['title'] ?? '')), 'text' => trim((string) ($r['text'] ?? ''))])
                ->filter(fn (array $r): bool => $r['title'] !== '' || $r['text'] !== '')
                ->values()
                ->all();
        }

        if (isset($obj['highlights']) && is_array($obj['highlights'])) {
            $out['highlights'] = collect($obj['highlights'])
                ->map(fn (array $r): array => ['title' => trim((string) ($r['title'] ?? '')), 'text' => trim((string) ($r['text'] ?? ''))])
                ->filter(fn (array $r): bool => $r['title'] !== '' || $r['text'] !== '')
                ->values()
                ->all();
        }

        foreach (['goals', 'main_points'] as $field) {
            if (isset($obj[$field]) && is_array($obj[$field])) {
                $out[$field] = collect($obj[$field])
                    ->map(fn ($v): string => trim((string) $v))
                    ->filter(fn (string $v): bool => $v !== '')
                    ->values()
                    ->all();
            }
        }

        if (isset($obj['faq']) && is_array($obj['faq'])) {
            $out['faq'] = collect($obj['faq'])
                ->map(fn (array $r): array => ['question' => trim((string) ($r['question'] ?? '')), 'answer' => trim((string) ($r['answer'] ?? ''))])
                ->filter(fn (array $r): bool => $r['question'] !== '' || $r['answer'] !== '')
                ->values()
                ->all();
        }

        if (isset($obj['message']) && is_array($obj['message'])) {
            $message = collect(['text', 'author_name', 'author_role', 'author_image'])
                ->mapWithKeys(fn (string $key): array => [$key => trim((string) ($obj['message'][$key] ?? ''))])
                ->filter(fn (string $v): bool => $v !== '')
                ->all();

            if ($message !== []) {
                $out['message'] = $message;
            }
        }

        // Empty lists are stored as [] (not dropped) so an explicit "clear all"
        // differs from "not provided"; the view already hides empty sections.
        return $out;
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

        $rules = [
            'slug' => $slugRule,
            'hero_image' => ['nullable', new ImageLocation, 'max:2048'],
            'video_embed' => ['nullable', 'string', 'max:5000'],
            'is_published' => ['nullable', 'boolean'],
            // Localized structured sections: shape is sanitized server-side,
            // validated only as per-language arrays here (avoids the nested
            // array-validation quirk in TranslationPayload::rules).
            'contents' => ['nullable', 'array'],
            'contents.*' => ['nullable', 'array'],
            'translations' => ['nullable', 'array'],
        ];

        $default = Language::defaultCode();

        foreach (collect(Language::activeList())->pluck('code')->all() as $code) {
            $rules["translations.$code"] = ['nullable', 'array'];
            $rules["translations.$code.title"] = ['string', 'max:255', $code === $default ? 'required' : 'nullable'];
            $rules["translations.$code.body"] = ['nullable', 'string'];
        }

        return $rules;
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
