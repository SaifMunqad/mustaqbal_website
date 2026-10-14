<?php

namespace App\Enums;

/**
 * The kinds of sections an admin can place on the public home page.
 *
 * Two families exist and drive very different editing UX:
 *  - "curated": pulls existing content (articles, events, recognition posts)
 *    onto the home page by referencing it, so it stays in sync with its source.
 *  - "authored": self-contained home-only content (banners, announcements)
 *    stored inline in the section's config.
 */
enum HomeSectionType: string
{
    case Banner = 'banner';
    case Announcement = 'announcement';
    case Recognition = 'recognition';
    case Articles = 'articles';
    case Events = 'events';

    public function label(): string
    {
        return match ($this) {
            self::Banner => 'Banner',
            self::Announcement => 'Announcement',
            self::Recognition => 'Recognition highlights',
            self::Articles => 'Articles',
            self::Events => 'Events',
        };
    }

    /**
     * Stable frontend i18n key; the UI translates this so labels follow the
     * active locale. English label() remains as the fallback.
     */
    public function labelKey(): string
    {
        return "enums.homeSectionType.{$this->value}";
    }

    /**
     * Curated sections reference existing content and render it at read time.
     */
    public function isCurated(): bool
    {
        return in_array($this, [self::Recognition, self::Articles, self::Events], true);
    }

    /**
     * Authored sections hold their own inline content in config.
     */
    public function isAuthored(): bool
    {
        return ! $this->isCurated();
    }

    /**
     * The frontend card variant used to render this section.
     */
    public function variant(): string
    {
        return match ($this) {
            self::Banner => 'banner',
            self::Announcement => 'announcement',
            default => 'cards',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $type): string => $type->value, self::cases());
    }

    /**
     * @return list<array{value: string, label: string, labelKey: string, kind: string}>
     */
    public static function options(): array
    {
        return array_map(
            static fn (self $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
                'labelKey' => $type->labelKey(),
                'kind' => $type->isCurated() ? 'curated' : 'authored',
            ],
            self::cases(),
        );
    }
}
