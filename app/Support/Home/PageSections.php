<?php

namespace App\Support\Home;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Enums\SectionType;
use App\Models\Article;
use App\Models\Event;
use App\Models\Job;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\Post;
use App\Models\Program;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Assembles a builder page's render-ready layout from normalized stores.
 *
 * Every block is eager-loaded with its child relations in a single query graph
 * (no N+1), curated content is resolved to *live* records through each source
 * model's public-visibility rules (never copied), and localized lists resolve
 * their text through the shared language fallback chain. The assembled payload
 * is cached per (page, locale) and versioned so a save invalidates every locale
 * at once. Degrades to an empty layout when tables aren't migrated yet.
 */
class PageSections
{
    /** @return list<array<string, mixed>> */
    public static function render(string $pageKey): array
    {
        try {
            $page = Page::query()->where('key', $pageKey)->first();

            if (! $page) {
                return [];
            }

            $locale = app()->getLocale();
            $version = (int) Cache::get(self::versionKey($pageKey), 0);

            return Cache::remember(
                self::cacheKey($pageKey, $locale, $version),
                now()->addMinutes(30),
                fn (): array => self::build($page, $locale),
            );
        } catch (\Throwable $e) {
            // Degrade to an empty layout for visitors, but never hide a bug from
            // the test suite.
            if (app()->environment('testing')) {
                throw $e;
            }

            return [];
        }
    }

    /** Invalidate every cached locale for a page (called from the write path). */
    public static function flush(string $pageKey): void
    {
        Cache::increment(self::versionKey($pageKey));
    }

    private static function cacheKey(string $pageKey, string $locale, int $version): string
    {
        return "pagebuilder.render.{$pageKey}.{$locale}.v{$version}";
    }

    private static function versionKey(string $pageKey): string
    {
        return "pagebuilder.version.{$pageKey}";
    }

    /** @return list<array<string, mixed>> */
    private static function build(Page $page, string $locale): array
    {
        $sections = $page->sections()
            ->where('is_active', true)
            ->with(['translations.language', 'items', 'listItems.language'])
            ->get();

        return $sections
            ->map(fn (PageSection $section): ?array => self::renderSection($section, $locale))
            ->filter()
            ->values()
            ->all();
    }

    /** @return array<string, mixed>|null */
    private static function renderSection(PageSection $section, string $locale): ?array
    {
        /** @var SectionType $type */
        $type = $section->section_type;

        $base = [
            'id' => $section->id,
            'type' => $type->value,
            'component' => $type->component(),
            'variant' => self::variantFor($type),
            'kind' => $type->isCurated() ? 'curated' : 'authored',
            'zone' => $section->zone,
            'sort_order' => $section->sort_order,
            'is_active' => $section->is_active,
            'type_label' => $type->label(),
            'title' => $section->translated('title', $locale) ?: '',
            'title_key' => $type->labelKey(),
            'spans' => self::spansFor($section, $type),
        ];

        return match ($type->component()) {
            'hero' => self::heroPayload($base, $section, $locale),
            'features' => self::listPayload($base, $section, $locale, 'features'),
            'stats' => self::listPayload($base, $section, $locale, 'stats'),
            'programs' => self::programsPayload($base, $section, $locale),
            'jobs' => self::jobsPayload($base, $section, $locale),
            'banner', 'announcement' => self::authoredPayload($base, $section, $locale),
            default => self::curatedPayload($base, $section, $type, $locale),
        };
    }

    /** @return array<string, mixed> */
    private static function heroPayload(array $base, PageSection $section, string $locale): array
    {
        $config = $section->config ?? [];

        return [
            ...$base,
            'hero' => [
                'title' => $section->translated('heading', $locale) ?: '',
                'subtitle' => $section->translated('body', $locale) ?: '',
                'cta_primary' => $section->translated('cta_label', $locale) ?: '',
                'cta_secondary' => $config['cta_secondary'] ?? '',
                'tagline' => $config['tagline'] ?? '',
                'hero_image' => $section->image_path ?: ($config['image_url'] ?? ''),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function listPayload(array $base, PageSection $section, string $locale, string $group): array
    {
        $rows = self::localizedRows($section, $group, $locale);

        return [
            ...$base,
            $group => match ($group) {
                'stats' => array_map(
                    static fn (array $r): array => ['value' => $r['value'], 'label' => $r['title']],
                    $rows,
                ),
                default => array_map(
                    static fn (array $r): array => [
                        'icon' => $r['icon'],
                        'title' => $r['title'],
                        'description' => $r['description'],
                    ],
                    $rows,
                ),
            },
        ];
    }

    /** @return array<string, mixed>|null */
    private static function authoredPayload(array $base, PageSection $section, string $locale): ?array
    {
        $heading = $section->translated('heading', $locale);
        $body = $section->translated('body', $locale);

        // Don't render an empty authored block.
        if (blank($heading) && blank($body)) {
            return null;
        }

        return [
            ...$base,
            'config' => [
                'heading' => $heading,
                'body' => $body,
                'image_url' => $section->image_path ?: null,
                'cta_label' => $section->translated('cta_label', $locale),
                'cta_url' => $section->cta_url ?: null,
                'tone' => $section->tone ?: 'default',
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function programsPayload(array $base, PageSection $section, string $locale): array
    {
        $ids = $section->itemIds();
        $limit = $section->limit ?? 2;

        $query = Program::query()->with(['translations.language', 'typeTranslations.language']);
        $programs = $ids !== []
            ? self::pickInOrder((clone $query)->whereKey($ids)->get(), $ids)
            : (clone $query)->orderBy('display_order')->orderBy('id')->limit($limit)->get();

        return [
            ...$base,
            'programs' => $programs
                ->map(fn (Program $p): array => self::mapProgram($p, $locale))
                ->values()
                ->all(),
        ];
    }

    /** @return array<string, mixed> */
    private static function jobsPayload(array $base, PageSection $section, string $locale): array
    {
        $ids = $section->itemIds();
        $limit = $section->limit ?? 2;

        $query = Job::query()->with('translations.language')->active();
        $jobs = $ids !== []
            ? self::pickInOrder((clone $query)->whereKey($ids)->get(), $ids)
            : (clone $query)->limit($limit)->get();

        return [
            ...$base,
            'jobs' => $jobs->map(fn (Job $j): array => $j->toCard())->values()->all(),
        ];
    }

    /** @return array<string, mixed>|null */
    private static function curatedPayload(array $base, PageSection $section, SectionType $type, string $locale): ?array
    {
        $cards = match ($type) {
            SectionType::Articles => self::articleCards($section, $locale),
            SectionType::Events => self::eventCards($section, $locale),
            SectionType::Recognition => self::recognitionCards($section, $locale),
            default => [],
        };

        // Hide an empty curated rail rather than render a bare heading.
        if ($cards === []) {
            return null;
        }

        return [...$base, 'items' => $cards];
    }

    /**
     * @return array{lg: int, md: int, sm: int}
     */
    private static function spansFor(PageSection $section, SectionType $type): array
    {
        $defaults = $type->defaultSpans();

        return [
            'lg' => $section->span_lg ?? $defaults['lg'],
            'md' => $section->span_md ?? $defaults['md'],
            'sm' => $section->span_sm ?? $defaults['sm'],
        ];
    }

    private static function variantFor(SectionType $type): string
    {
        return match ($type->component()) {
            'banner' => 'banner',
            'announcement' => 'announcement',
            default => 'cards',
        };
    }

    /**
     * The ordered rows of a localized list group, resolved through the language
     * fallback chain (preferred -> default -> fallback -> en). Shared rows
     * (null language) always apply.
     *
     * @return list<array<string, string>>
     */
    private static function localizedRows(PageSection $section, string $group, string $locale): array
    {
        $all = $section->listItems->filter(fn ($row) => $row->item_group === $group);
        $byCode = $all->keyBy(fn ($row) => $row->language?->code ?? '*');

        $pick = null;
        foreach (Language::fallbackCodes($locale) as $code) {
            if ($byCode->has($code)) {
                $pick = $code;
                break;
            }
        }

        $selected = $pick !== null
            ? $all->where(fn ($row) => ($row->language?->code ?? '*') === $pick)
            : $all->where('language_id', null);

        return $selected
            ->sortBy(fn ($row): int => (int) $row->sort_order)
            ->map(static fn ($row): array => [
                'value' => (string) $row->value,
                'title' => (string) $row->title,
                'description' => (string) $row->description,
                'icon' => (string) $row->icon,
                'image' => (string) $row->image_path,
                'url' => (string) $row->url,
            ])
            ->values()
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private static function articleCards(PageSection $section, string $locale): array
    {
        $ids = $section->itemIds();
        $limit = $section->limit ?? 3;

        $query = Article::query()->with('author:id,name')->where('is_published', true)->whereNotNull('published_at');
        $articles = $ids !== []
            ? self::pickInOrder($query->whereKey($ids)->get(), $ids)
            : $query->latest('published_at')->limit($limit)->get();

        return $articles->map(fn (Article $a): array => [
            'id' => $a->id,
            'title' => $a->title,
            'subtitle' => $a->writer_name ?: $a->author?->name,
            'excerpt' => $a->excerpt ?: str($a->body)->limit(140)->toString(),
            'image' => $a->cover_image ?: ($a->images[0] ?? null),
            'url' => '/school/articles/' . $a->slug,
            'date' => $a->published_at?->toIso8601String(),
            'dir' => $a->language_dir,
        ])->values()->all();
    }

    /** @return list<array<string, mixed>> */
    private static function eventCards(PageSection $section, string $locale): array
    {
        $ids = $section->itemIds();
        $limit = $section->limit ?? 3;

        $base = Event::query()->with('translations.language')->visibleTo(null);
        $events = $ids !== []
            ? self::pickInOrder((clone $base)->whereKey($ids)->get(), $ids)
            : (clone $base)->upcoming()->limit($limit)->get();

        return $events->map(fn (Event $e): array => [
            'id' => $e->id,
            'title' => $e->title,
            'subtitle' => $e->location,
            'excerpt' => $e->excerpt,
            'image' => $e->cover_image ?: ($e->images[0] ?? null),
            'url' => '/school/events/' . $e->slug,
            'date' => $e->start_at?->toIso8601String(),
            'dir' => null,
        ])->values()->all();
    }

    /** @return list<array<string, mixed>> */
    private static function recognitionCards(PageSection $section, string $locale): array
    {
        $ids = $section->itemIds();
        $limit = $section->limit ?? 3;

        $base = Post::query()
            ->with(['author:id,name', 'highlightedStudent:id,name', 'translations.language'])
            ->where('visibility', PostVisibility::Public->value)
            ->whereIn('type', array_map(static fn (PostType $t): string => $t->value, PostType::recognitionTypes()));

        $posts = $ids !== []
            ? self::pickInOrder((clone $base)->whereKey($ids)->get(), $ids)
            : (clone $base)->featuredCurrently()->latest('featured_from')->limit($limit)->get();

        if ($ids === [] && $posts->isEmpty()) {
            $posts = (clone $base)->latest()->limit($limit)->get();
        }

        return $posts->map(fn (Post $p): array => [
            'id' => $p->id,
            'title' => $p->title,
            'subtitle' => $p->highlightedStudent?->name ?? $p->author?->name,
            'excerpt' => str(strip_tags($p->content))->limit(140)->toString(),
            'image' => $p->images[0] ?? null,
            'url' => '/school/showcase',
            'date' => $p->created_at?->toIso8601String(),
            'dir' => null,
        ])->values()->all();
    }

    /** @return array<string, mixed> */
    private static function mapProgram(Program $program, string $locale): array
    {
        return [
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
        ];
    }

    /**
     * Re-order a fetched collection to match the admin's explicit id order,
     * dropping ids that no longer resolve to a visible record.
     *
     * @param  Collection<int, mixed>  $records
     * @param  list<int>  $ids
     * @return Collection<int, mixed>
     */
    private static function pickInOrder(Collection $records, array $ids): Collection
    {
        $byId = $records->keyBy('id');

        return new Collection(array_values(array_filter(
            array_map(static fn (int $id) => $byId->get($id), $ids),
        )));
    }
}
