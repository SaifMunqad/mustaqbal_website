<?php

namespace App\Enums;

/**
 * The canonical block types for the normalized page builder.
 *
 * A superset of the legacy {@see HomeSectionType}: it keeps the existing
 * curated/authored families and adds the previously-hardcoded home blocks (hero,
 * programs, features, stats, jobs) plus a broad catalog of content rails,
 * conversion and layout blocks so admins can compose a rich page from a palette.
 *
 * Each case carries the metadata the builder needs — grid defaults, instance
 * caps, the render component, and which child stores it writes to — so the
 * sidebar palette, validation, persistence and rendering all derive from one
 * source instead of scattered `match` statements. List-style blocks reuse a
 * single `section_list_items` group (named by {@see listGroup()}); curated
 * blocks reference live content by id ({@see itemType()}).
 */
enum SectionType: string
{
    // --- Authored, self-contained blocks ---
    case Hero = 'hero';
    case SplitHero = 'split_hero';
    case Features = 'features';
    case IconCards = 'icon_cards';
    case Stats = 'stats';
    case StatsCards = 'stats_cards';
    case Banner = 'banner';
    case Announcement = 'announcement';
    case AnnouncementBar = 'announcement_bar';
    case CtaBand = 'cta_band';
    case Quote = 'quote';
    case MediaText = 'media_text';
    case RichText = 'rich_text';
    case VideoEmbed = 'video_embed';
    case Map = 'map';
    case Newsletter = 'newsletter';
    case Countdown = 'countdown';
    case Contact = 'contact';
    case ContactForm = 'contact_form';
    case ContactDetails = 'contact_details';

    // --- List-driven authored rails ---
    case Testimonials = 'testimonials';
    case Team = 'team';
    case Partners = 'partners';
    case Gallery = 'gallery';
    case Faqs = 'faqs';
    case SocialLinks = 'social_links';

    // --- Curated blocks that reference live content by id ---
    case Programs = 'programs';
    case Jobs = 'jobs';
    case Recognition = 'recognition';
    case Articles = 'articles';
    case Events = 'events';

    public function label(): string
    {
        return match ($this) {
            self::Hero => 'Hero',
            self::SplitHero => 'Split hero',
            self::Features => 'Why-families features',
            self::IconCards => 'Icon cards',
            self::Stats => 'Quick stats bar',
            self::StatsCards => 'Stat cards',
            self::Banner => 'Banner',
            self::Announcement => 'Announcement',
            self::AnnouncementBar => 'Announcement bar',
            self::CtaBand => 'Call to action',
            self::Quote => 'Quote',
            self::MediaText => 'Media + text',
            self::RichText => 'Rich text',
            self::VideoEmbed => 'Video',
            self::Map => 'Map',
            self::Newsletter => 'Newsletter signup',
            self::Countdown => 'Countdown',
            self::Contact => 'Contact',
            self::ContactForm => 'Contact form',
            self::ContactDetails => 'Contact details',
            self::Testimonials => 'Testimonials',
            self::Team => 'Team / staff',
            self::Partners => 'Partners / logos',
            self::Gallery => 'Gallery',
            self::Faqs => 'FAQ',
            self::SocialLinks => 'Social links',
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

    /**
     * The palette group a block belongs to, so the sidebar can be categorized
     * instead of one long flat list. Keys map to {@see categories()}.
     */
    public function category(): string
    {
        return match ($this) {
            self::Hero, self::SplitHero, self::Banner, self::Announcement,
            self::AnnouncementBar, self::Quote, self::MediaText, self::VideoEmbed,
            self::Map, self::Countdown => 'layout',
            self::Features, self::IconCards, self::Stats, self::StatsCards,
            self::Testimonials, self::Team, self::Partners, self::Gallery, self::Faqs,
            self::RichText => 'content',
            self::CtaBand, self::Newsletter, self::Contact, self::ContactForm,
            self::ContactDetails, self::SocialLinks => 'conversion',
            self::Programs, self::Jobs, self::Recognition, self::Articles, self::Events => 'live',
        };
    }

    /**
     * The ordered palette categories (slug + English label + i18n key).
     *
     * @return list<array{value: string, label: string, labelKey: string}>
     */
    public static function categories(): array
    {
        return [
            ['value' => 'layout', 'label' => 'Layout & media', 'labelKey' => 'enums.sectionCategory.layout'],
            ['value' => 'content', 'label' => 'Content rails', 'labelKey' => 'enums.sectionCategory.content'],
            ['value' => 'conversion', 'label' => 'Conversion', 'labelKey' => 'enums.sectionCategory.conversion'],
            ['value' => 'live', 'label' => 'Live content', 'labelKey' => 'enums.sectionCategory.live'],
        ];
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
            self::Hero, self::SplitHero => 'hero',
            self::Features => 'features',
            self::IconCards => 'icon_cards',
            self::Stats => 'stats',
            self::StatsCards => 'stats_cards',
            self::Programs => 'programs',
            self::Jobs => 'jobs',
            self::Banner => 'banner',
            self::Announcement, self::AnnouncementBar => 'announcement',
            self::CtaBand => 'cta',
            self::Quote => 'quote',
            self::MediaText => 'media_text',
            self::RichText => 'rich_text',
            self::VideoEmbed => 'video',
            self::Map => 'map',
            self::Newsletter => 'newsletter',
            self::Countdown => 'countdown',
            self::Contact => 'contact',
            self::ContactForm => 'contact_form',
            self::ContactDetails => 'contact_details',
            self::Testimonials, self::Team => 'list',
            self::Partners => 'logos',
            self::Gallery => 'gallery',
            self::Faqs => 'faq',
            self::SocialLinks => 'social',
            default => 'cards',
        };
    }

    /**
     * How many of this block a page may hold. Always `null` = unlimited: admins
     * can place the same section as many times as they need. Kept as a hook so a
     * future per-type cap is a one-line change.
     */
    public function maxInstances(): ?int
    {
        return null;
    }

    /**
     * Which child stores a block writes to. `items` = curated references,
     * `list` = ordered localized rows, `media` = an image on the parent column.
     *
     * @return list<string>
     */
    public function stores(): array
    {
        return match ($this) {
            self::Programs, self::Jobs, self::Recognition, self::Articles, self::Events => ['settings', 'items', 'translations'],
            self::Features, self::IconCards, self::Stats, self::StatsCards,
            self::Testimonials, self::Team, self::Partners, self::Gallery, self::Faqs,
            self::SocialLinks, self::Contact => ['settings', 'list', 'translations'],
            self::Hero, self::SplitHero, self::Banner, self::Announcement, self::AnnouncementBar,
            self::CtaBand, self::Quote, self::MediaText, self::RichText, self::VideoEmbed,
            self::Map, self::Newsletter, self::Countdown => ['settings', 'media', 'translations'],
            // Text-only blocks whose body is fully driven by live settings or a
            // built-in form, so they only own localized copy.
            self::ContactForm, self::ContactDetails => ['settings', 'translations'],
        };
    }

    /**
     * The list-item group a collection block writes to in `section_list_items`;
     * null for blocks without a list store.
     */
    public function listGroup(): ?string
    {
        return match ($this) {
            self::Features, self::IconCards => 'features',
            self::Stats, self::StatsCards => 'stats',
            self::Testimonials => 'testimonials',
            self::Team => 'team',
            self::Partners => 'partners',
            self::Gallery => 'gallery',
            self::Faqs => 'faqs',
            self::SocialLinks => 'social',
            self::Contact => 'contact',
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

    /**
     * Default responsive grid spans (1-12) per breakpoint. Content rails are
     * full-width containers with their own internal grid; a couple of light
     * blocks default narrower so they can sit side by side without the admin
     * having to set spans.
     *
     * @return array{lg: int, md: int, sm: int}
     */
    public function defaultSpans(): array
    {
        return match ($this) {
            self::Quote, self::Countdown, self::Newsletter => ['lg' => 6, 'md' => 12, 'sm' => 12],
            default => ['lg' => 12, 'md' => 12, 'sm' => 12],
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $type): string => $type->value, self::cases());
    }

    /**
     * Palette options: enough metadata to render a labeled, sketched, draggable
     * chip and to drive the block editor's panels.
     *
     * @return list<array<string, mixed>>
     */
    public static function options(): array
    {
        return array_map(
            static fn (self $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
                'labelKey' => $type->labelKey(),
                'kind' => $type->isCurated() ? 'curated' : 'authored',
                'component' => $type->component(),
                'list_group' => $type->listGroup(),
                'category' => $type->category(),
                'maxInstances' => $type->maxInstances(),
            ],
            self::cases(),
        );
    }
}
