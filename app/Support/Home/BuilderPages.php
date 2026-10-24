<?php

namespace App\Support\Home;

/**
 * The catalog of pages the unified page builder manages.
 *
 * Storage is keyed by each page's stable `key`, so this registry is the single
 * place that knows which keys exist, what the editor chrome shows for them and
 * where the breadcrumb's parent screen lives. Every builder page offers the
 * exact same block catalog (see {@see \App\Enums\SectionType}), so exposing a
 * new page only means adding an entry here plus its two dashboard routes.
 */
class BuilderPages
{
    /**
     * Page key => editor metadata.
     *
     * `index_url` is the route name of the screen the editor breadcrumbs back
     * to; null when the page has no dedicated settings screen (the builder is
     * then the only admin surface for it). `component` is the Inertia page file
     * that edits the layout, named after the function it exports.
     *
     * @var array<string, array{label: string, label_key: string, index_url: string|null, component: string}>
     */
    private const PAGES = [
        'home' => [
            'label' => 'Home page',
            'label_key' => 'dashboard.homeSections.title',
            'index_url' => 'dashboard.home-sections.index',
            'component' => 'dashboard/page-builder/dashboard-page-builder-home',
        ],
        'about' => [
            'label' => 'About page',
            'label_key' => 'dashboard.about.title',
            'index_url' => 'dashboard.about.edit',
            'component' => 'dashboard/page-builder/dashboard-page-builder-about',
        ],
        'contact' => [
            'label' => 'Contact page',
            'label_key' => 'dashboard.contactPage.title',
            'index_url' => null,
            'component' => 'dashboard/page-builder/dashboard-page-builder-contact',
        ],
    ];

    /**
     * Every builder page key, in admin display order.
     *
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_keys(self::PAGES);
    }

    /** Whether the key addresses a builder-managed page. */
    public static function has(string $key): bool
    {
        return array_key_exists($key, self::PAGES);
    }

    /** The page opened when no specific key is requested. */
    public static function default(): string
    {
        return 'home';
    }

    /** Human label shown in the editor chrome (English fallback). */
    public static function label(string $key): string
    {
        return self::PAGES[$key]['label'] ?? ucfirst($key);
    }

    /** Frontend i18n key for {@see label()}. */
    public static function labelKey(string $key): string
    {
        return self::PAGES[$key]['label_key'] ?? 'dashboard.homeSections.title';
    }

    /**
     * The Inertia page component that edits this page's layout.
     *
     * Exposed here so the builder controller never has to concatenate a page
     * key into a path: each page keeps its own function-named module.
     */
    public static function inertiaComponent(string $key): string
    {
        return self::PAGES[$key]['component']
            ?? self::PAGES[self::default()]['component'];
    }

    /**
     * The editor breadcrumb's parent URL, or null when the page has no
     * dedicated settings screen.
     */
    public static function indexUrl(string $key): ?string
    {
        $name = self::PAGES[$key]['index_url'] ?? null;

        return $name !== null ? route($name) : null;
    }
}
