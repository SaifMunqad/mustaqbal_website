<?php

namespace App\Enums;

/**
 * The canonical block types for the normalized page builder.
 *
 * This is a superset of the legacy {@see HomeSectionType}: it keeps the existing
 * curated/authored families and adds the previously-hardcoded home blocks (hero,
 * programs, features, stats, jobs) as first-class, orderable, duplicatable types.
 * Each case carries the metadata the builder needs — grid defaults, instance
 * caps, and which child stores it writes to — so the palette, validation and
 * rendering all derive from one source instead of scattered `match` statements.
 *
 * The legacy enum stays untouched during the transition; backfill maps onto this.
 */
enum SectionType: string
{
    // Authored, self-contained blocks (previously hardcoded on the canvas).
    case Hero = 'hero';
    case Features = 'features';
    case Stats = 'stats';
    case Banner = 'banner';
    case Announcement = 'announcement';

    // Curated blocks that reference live content by id.
    case Programs = 'programs';
    case Jobs = 'jobs';
    case Recognition = 'recognition';
    case Articles = 'articles';
    case Events = 'events';

    public function label(): string
    {
        return match ($this) {
            self::Hero => 'Hero',
            self::Features => 'Why-families features',
            self::Stats => 'Quick stats',
            self::Banner => 'Banner',
            self::Announcement => 'Announcement',
            self::Programs => 'Programs',
            self::Jobs => 'Latest jobs',
            self::Recognition => 'Recognition highlights',
            self::Articles => 'Articles',
            self::Events => 'Events',
        };
    }

    /** Stable frontend i18n key; English {@see label()} remains the fallback. */
    public function labelKey(): string
    {
        return "enums.sectionType.{$this->value}";
    }

    /** Curated sections reference existing content and resolve it live at read time. */
    public function isCurated(): bool
    {
        return in_array($this, [self::Programs, self::Jobs, self::Recognition, self::Articles, self::Events], true);
    }

    public function isAuthored(): bool
    {
        return ! $this->isCurated();
    }

    /**
     * The frontend component that renders this block (the type -> component map
     * used by BOTH the public page and the editor canvas).
     */
    public function component(): string
    {
        return match ($this) {
            self::Hero => 'hero',
            self::Features => 'features',
            self::Stats => 'stats',
            self::Programs => 'programs',
            self::Jobs => 'jobs',
            self::Banner => 'banner',
            self::Announcement => 'announcement',
            default => 'cards',
        };
    }

    /**
     * How many of this block a page may hold. `null` = unlimited (the admin can
     * place it as often as they need); `1` = singleton (only one hero makes sense).
     */
    public function maxInstances(): ?int
    {
        return match ($this) {
            self::Hero => 1,
            default => null,
        };
    }

    /**
     * Which child stores a block of this type writes to. Drives the save diff and
     * tells the editor which panels to show. `settings` = typed columns/config.
     *
     * @return list<string>
     */
    public function stores(): array
    {
        return match ($this) {
            self::Hero, self::Banner, self::Announcement => ['settings', 'media', 'translations'],
            self::Features, self::Stats => ['settings', 'list', 'translations'],
            self::Programs, self::Jobs, self::Recognition, self::Articles, self::Events => ['settings', 'items', 'translations'],
        };
    }

    /**
     * Default responsive grid spans (1-12 of a 12-column grid) per breakpoint.
     * Every block is full-width by default; the admin can shrink it so siblings
     * share a row. Null `page_sections` span columns fall back to these.
     *
     * @return array{lg: int, md: int, sm: int}
     */
    public function defaultSpans(): array
    {
        return ['lg' => 12, 'md' => 12, 'sm' => 12];
    }

    /**
     * The list item group a collection block writes to in `section_list_items`.
     */
    public function listGroup(): ?string
    {
        return match ($this) {
            self::Features => 'features',
            self::Stats => 'stats',
            default => null,
        };
    }

    /**
     * For curated blocks, the source model a picked item references.
     */
    public function itemType(): ?string
    {
        return match ($this) {
            self::Articles => 'article',
            self::Events => 'event',
            self::Recognition => 'post',
            self::Programs => 'program',
            self::Jobs => 'job',
            default => null,
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $type): string => $type->value, self::cases());
    }

    /**
     * Palette options grouped by kind.
     *
     * @return list<array{value: string, label: string, labelKey: string, kind: string, maxInstances: int|null}>
     */
    public static function options(): array
    {
        return array_map(
            static fn (self $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
                'labelKey' => $type->labelKey(),
                'kind' => $type->isCurated() ? 'curated' : 'authored',
                'maxInstances' => $type->maxInstances(),
            ],
            self::cases(),
        );
    }
}
