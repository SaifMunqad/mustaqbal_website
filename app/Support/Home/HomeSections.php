<?php

namespace App\Support\Home;

use App\Enums\HomeSectionType;
use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Models\Article;
use App\Models\Event;
use App\Models\HomeSection;
use App\Models\Post;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

/**
 * Assembles the public home-page layout from admin-curated sections.
 *
 * Curated sections are resolved to *live* records on every request (never
 * copied), so edited, unpublished or deleted source content can't linger on the
 * home page. Public visibility rules of each source model are reused, which is
 * what prevents a private article/event from being surfaced by a stray pick.
 */
class HomeSections
{
    /**
     * Build the render-ready payload for the home page.
     *
     * Returns an empty array when the feature isn't set up yet (table not
     * migrated, or no active sections) so callers can fall back to legacy
     * behaviour without special-casing errors.
     *
     * @return list<array<string, mixed>>
     */
    public static function render(): array
    {
        try {
            $sections = HomeSection::query()->activeOrdered()->get();
        } catch (\Throwable) {
            // home_sections table doesn't exist yet (migrations not run) — degrade.
            return [];
        }

        return $sections
            ->map(fn (HomeSection $section): ?array => self::renderSection($section))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function renderSection(HomeSection $section): ?array
    {
        $type = $section->section_type;

        if ($type->isAuthored()) {
            $config = $section->config ?? [];

            // Don't render an empty authored block.
            if (blank($config['heading'] ?? null) && blank($config['body'] ?? null)) {
                return null;
            }

            return [
                'id' => $section->id,
                'type' => $type->value,
                'variant' => $type->variant(),
                'title' => $section->title,
                'config' => [
                    'heading' => $config['heading'] ?? null,
                    'body' => $config['body'] ?? null,
                    'image_url' => $config['image_url'] ?? null,
                    'cta_label' => $config['cta_label'] ?? null,
                    'cta_url' => $config['cta_url'] ?? null,
                    'tone' => $config['tone'] ?? 'default',
                ],
            ];
        }

        $cards = self::curatedCards($section);

        if ($cards === []) {
            return null;
        }

        return [
            'id' => $section->id,
            'type' => $type->value,
            'variant' => $type->variant(),
            'title' => $section->title ?: '',
            // Fallback heading key so an untitled section still shows a localized
            // label; the admin's own title (when set) always wins.
            'titleKey' => $type->labelKey(),
            'items' => $cards,
        ];
    }

    /**
     * Resolve a curated section to a list of card payloads.
     *
     * Explicit picks are honoured in the chosen order but filtered through each
     * model's public-visibility rules; with no picks we show the latest items.
     *
     * @return list<array<string, mixed>>
     */
    private static function curatedCards(HomeSection $section): array
    {
        return match ($section->section_type) {
            HomeSectionType::Articles => self::articleCards($section),
            HomeSectionType::Events => self::eventCards($section),
            HomeSectionType::Recognition => self::recognitionCards($section),
            default => [],
        };
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function articleCards(HomeSection $section): array
    {
        $ids = $section->itemIds();
        $limit = $section->limit ?? 3;

        $query = Article::query()
            ->with('author:id,name')
            ->where('is_published', true)
            ->whereNotNull('published_at');

        $articles = $ids !== []
            ? self::pickInOrder($query->whereKey($ids)->get(), $ids)
            : $query->latest('published_at')->limit($limit)->get();

        return $articles
            ->map(fn (Article $article): array => self::mapArticle($article))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private static function mapArticle(Article $article): array
    {
        return [
            'id' => $article->id,
            'title' => $article->title,
            'subtitle' => $article->writer_name ?: $article->author?->name,
            'excerpt' => $article->excerpt ?: str($article->body)->limit(140)->toString(),
            'image' => $article->cover_image ?: ($article->images[0] ?? null),
            'url' => '/school/articles/'.$article->slug,
            'date' => $article->published_at?->toIso8601String(),
            'dir' => $article->language_dir,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function eventCards(HomeSection $section): array
    {
        $ids = $section->itemIds();
        $limit = $section->limit ?? 3;

        // Guests see only public, published events — reuses the model's rule.
        $base = Event::query()->visibleTo(null);

        $events = $ids !== []
            ? self::pickInOrder((clone $base)->whereKey($ids)->get(), $ids)
            : (clone $base)->upcoming()->limit($limit)->get();

        return $events
            ->map(fn (Event $event): array => self::mapEvent($event))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private static function mapEvent(Event $event): array
    {
        return [
            'id' => $event->id,
            'title' => $event->title,
            'subtitle' => $event->location,
            'excerpt' => $event->excerpt,
            'image' => $event->cover_image ?: ($event->images[0] ?? null),
            'url' => '/school/events/'.$event->slug,
            'date' => $event->start_at?->toIso8601String(),
            'dir' => null,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function recognitionCards(HomeSection $section): array
    {
        $ids = $section->itemIds();
        $limit = $section->limit ?? 3;

        $recognitionTypes = array_map(
            static fn (PostType $type): string => $type->value,
            PostType::recognitionTypes(),
        );

        $base = Post::query()
            ->with(['author:id,name', 'highlightedStudent:id,name'])
            ->where('visibility', PostVisibility::Public->value)
            ->whereIn('type', $recognitionTypes);

        $posts = $ids !== []
            ? self::pickInOrder((clone $base)->whereKey($ids)->get(), $ids)
            : (clone $base)
                ->featuredCurrently()
                ->latest('featured_from')
                ->limit($limit)
                ->get();

        // Fall back to newest public recognition posts when nothing is featured.
        if ($ids === [] && $posts->isEmpty()) {
            $posts = (clone $base)->latest()->limit($limit)->get();
        }

        return $posts
            ->map(fn (Post $post): array => [
                'id' => $post->id,
                'title' => $post->title,
                'subtitle' => $post->highlightedStudent?->name ?? $post->author?->name,
                'excerpt' => str(strip_tags($post->content))->limit(140)->toString(),
                'image' => $post->images[0] ?? null,
                'url' => '/school/showcase',
                'date' => $post->created_at?->toIso8601String(),
                'dir' => null,
            ])
            ->all();
    }

    /**
     * Re-order a fetched collection to match the admin's explicit id order,
     * dropping ids that no longer resolve to a visible record.
     *
     * @param  Collection<int, Model>  $records
     * @param  list<int>  $ids
     * @return Collection<int, Model>
     */
    private static function pickInOrder(Collection $records, array $ids): Collection
    {
        $byId = $records->keyBy('id');

        return collect(array_values(array_filter(
            array_map(static fn (int $id) => $byId->get($id), $ids),
        )));
    }

    /**
     * Candidate items offered to the admin picker for a curated type.
     *
     * @return list<array{id: int, label: string}>
     */
    public static function availableItems(HomeSectionType $type): array
    {
        try {
            return match ($type) {
                HomeSectionType::Articles => Article::query()
                    ->where('is_published', true)
                    ->whereNotNull('published_at')
                    ->latest('published_at')
                    ->limit(100)
                    ->get()
                    ->map(fn (Article $a): array => ['id' => $a->id, 'label' => $a->title])
                    ->all(),
                HomeSectionType::Events => Event::query()
                    ->visibleTo(null)
                    ->orderBy('start_at')
                    ->limit(100)
                    ->get()
                    ->map(fn (Event $e): array => ['id' => $e->id, 'label' => $e->title])
                    ->all(),
                HomeSectionType::Recognition => Post::query()
                    ->where('visibility', PostVisibility::Public->value)
                    ->whereIn('type', array_map(
                        static fn (PostType $t): string => $t->value,
                        PostType::recognitionTypes(),
                    ))
                    ->latest()
                    ->limit(100)
                    ->get()
                    ->map(fn (Post $p): array => [
                        'id' => $p->id,
                        'label' => trim(($p->title ?? '').($p->type instanceof PostType ? ' — '.$p->type->label() : '')),
                    ])
                    ->all(),
                default => [],
            };
        } catch (\Throwable) {
            return [];
        }
    }
}
