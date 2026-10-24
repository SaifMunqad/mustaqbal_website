<?php

namespace App\Support\Home;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Enums\SectionType;
use App\Models\Article;
use App\Models\Event;
use App\Models\Job;
use App\Models\PageSection;
use App\Models\Post;
use App\Models\Program;

/**
 * Single source of truth for the page-builder palette and its constraints.
 *
 * Everything the editor needs to offer a block type — whether an instance can
 * still be added (maxInstances), its default responsive spans, and the live
 * candidate items a curated block can pick — is derived here from
 * {@see SectionType}, so the sidebar palette and the server-side save validation
 * enforce exactly the same rules and can never drift apart.
 *
 * The catalog is global: every builder page ({@see BuilderPages}) offers every
 * block type, so an admin can compose any page from the same collection.
 */
class BlockRegistry
{
    /**
     * Whether another block of this type may be added to a page.
     */
    public static function canAddMore(SectionType $type, int $currentCount): bool
    {
        $max = $type->maxInstances();

        return $max === null || $currentCount < $max;
    }

    /**
     * Whether a block may be added on a page. The catalog is shared across every
     * builder page, so this only rejects page keys the builder does not manage.
     */
    public static function canUse(string $pageKey, SectionType $type): bool
    {
        return BuilderPages::has($pageKey);
    }

    /**
     * The palette for any builder page, with an `addable` flag reflecting the
     * current instance count.
     *
     * @param  array<string, int>  $countsByType  section_type value => instance count on the page
     * @return list<array<string, mixed>>
     */
    public static function palette(array $countsByType = []): array
    {
        return array_map(
            static function (array $option) use ($countsByType): array {
                $type = SectionType::from($option['value']);
                $current = $countsByType[$type->value] ?? 0;

                return [...$option, 'addable' => self::canAddMore($type, $current)];
            },
            SectionType::options(),
        );
    }

    /**
     * Resolve a page's current instance count per block type.
     *
     * @return array<string, int>
     */
    public static function countsFor(int $pageId): array
    {
        return PageSection::query()
            ->where('page_id', $pageId)
            ->selectRaw('section_type, count(*) as aggregate')
            ->groupBy('section_type')
            ->pluck('aggregate', 'section_type')
            ->map(fn ($v): int => (int) $v)
            ->all();
    }

    /**
     * Candidate items offered to the picker for a curated block type.
     *
     * @return list<array{id: int, label: string}>
     */
    public static function availableItems(SectionType $type): array
    {
        try {
            return match ($type) {
                SectionType::Articles => Article::query()
                    ->where('is_published', true)
                    ->whereNotNull('published_at')
                    ->latest('published_at')
                    ->limit(100)
                    ->get()
                    ->map(fn (Article $a): array => ['id' => $a->id, 'label' => $a->title])
                    ->all(),
                SectionType::Events => Event::query()
                    ->with('translations.language')
                    ->visibleTo(null)
                    ->orderBy('start_at')
                    ->limit(100)
                    ->get()
                    ->map(fn (Event $e): array => ['id' => $e->id, 'label' => $e->title])
                    ->all(),
                SectionType::Recognition => Post::query()
                    ->with('translations.language')
                    ->where('visibility', PostVisibility::Public->value)
                    ->whereIn('type', array_map(
                        static fn (PostType $t): string => $t->value,
                        PostType::recognitionTypes(),
                    ))
                    ->latest()
                    ->limit(100)
                    ->get()
                    ->map(fn (Post $p): array => ['id' => $p->id, 'label' => $p->title])
                    ->all(),
                SectionType::Programs => Program::query()
                    ->orderBy('display_order')
                    ->orderBy('id')
                    ->limit(100)
                    ->get()
                    ->map(fn (Program $p): array => ['id' => $p->id, 'label' => $p->name])
                    ->all(),
                SectionType::Jobs => Job::query()
                    ->active()
                    ->latest()
                    ->limit(100)
                    ->get()
                    ->map(fn (Job $j): array => ['id' => $j->id, 'label' => $j->title])
                    ->all(),
                default => [],
            };
        } catch (\Throwable) {
            return [];
        }
    }
}
