import {
    BookOpen,
    Building2,
    GraduationCap,
    HeartHandshake,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';
import { forwardRef, useEffect, useState, type ComponentType } from 'react';

import { BRAND_ICONS } from '@/lib/brand-icons';

/**
 * The prop surface every selectable icon supports: Lucide glyphs, generated
 * Heroicons components and the brand SVGs defined here all accept these. The
 * resolvers below hand back a component, never a key, so renderers stay free
 * of icon-registry details.
 */
export type AppIconComponent = ComponentType<{
    className?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
}>;

/** Broader component shape the Heroicons catalog registers (extra title props). */
export type HeroIconComponent = ComponentType<{
    className?: string;
    title?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
}>;

/**
 * Legacy icon keys seeded before the picker existed. Kept so older rows and
 * settings keep resolving; new selections come from the catalog instead.
 */
const LEGACY_ICONS: Record<string, AppIconComponent> = {
    faculty: Users as AppIconComponent,
    values: HeartHandshake as AppIconComponent,
    facilities: Building2 as AppIconComponent,
    classes: GraduationCap as AppIconComponent,
    'book-open': BookOpen as AppIconComponent,
    sparkles: Sparkles as AppIconComponent,
    'heart-handshake': HeartHandshake as AppIconComponent,
    users: Users as AppIconComponent,
    'shield-check': ShieldCheck as AppIconComponent,
    'graduation-cap': GraduationCap as AppIconComponent,
    star: Sparkles as AppIconComponent,
};

/** Default glyph for blank or unresolved keys (and pre-catalog SSR renders). */
export const FALLBACK_ICON: AppIconComponent = Sparkles as AppIconComponent;

/**
 * Keys populated when the generated Heroicons catalog loads ('h:<name>' for
 * the outline style, 'solid:h:<name>' for the filled one). The catalog is a
 * separate lazy chunk so public pages only pay ~75KB gzip when they actually
 * use a catalog glyph; renderers subscribe via `useIconCatalogReady` and swap
 * the fallback for the real icon the moment it lands.
 */
const HERO_REGISTRY: Record<string, HeroIconComponent> = {};

let catalogLoaded = false;
const catalogListeners = new Set<() => void>();

function notifyCatalogReady() {
    catalogLoaded = true;
    for (const listener of catalogListeners) listener();
    catalogListeners.clear();
}

/** Whether the generated Heroicons chunk has been imported and registered. */
export function iconCatalogLoaded(): boolean {
    return catalogLoaded;
}

/**
 * Subscribe to catalog availability. Returns false on the server and while
 * the lazy chunk is still in flight, so both first paints render the same
 * fallback and the upgrade to the real glyph happens in one post-hydration
 * update — never a hydration mismatch.
 */
export function useIconCatalogReady(): boolean {
    const [ready, setReady] = useState(catalogLoaded);
    useEffect(() => {
        if (ready) return;
        const listener = () => setReady(true);
        catalogListeners.add(listener);
        return () => {
            catalogListeners.delete(listener);
        };
    }, [ready]);
    return ready;
}

/** Register the generated catalog's components (called by hero-catalog.ts). */
export function registerHeroIcons(icons: Record<string, HeroIconComponent>) {
    Object.assign(HERO_REGISTRY, icons);
    notifyCatalogReady();
}

/**
 * Social brand glyphs, built from the embedded `simple-icons` path data and
 * stored as `social:<slug>`. Static so the footer, contact panels and the
 * builder preview always resolve them — unlike the Heroicons chunk they cost
 * only a few kilobytes.
 */
function brandIcon(path: string, title: string): AppIconComponent {
    const Icon = forwardRef<SVGSVGElement, { className?: string }>(
        function BrandIcon({ className, ...props }, ref) {
            return (
                <svg
                    ref={ref}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    role="img"
                    aria-label={title}
                    className={className}
                    {...props}
                >
                    <path d={path} />
                </svg>
            );
        },
    );
    return Icon as unknown as AppIconComponent;
}

const SOCIAL_REGISTRY: Record<string, AppIconComponent> = {};
for (const brand of BRAND_ICONS) {
    SOCIAL_REGISTRY[`social:${brand.slug}`] = brandIcon(brand.path, brand.title);
}

/** Picker entries for the social set, derived from the embedded brand data. */
export const SOCIAL_OPTIONS: Array<{ value: string; label: string }> =
    BRAND_ICONS.map((brand) => ({
        value: `social:${brand.slug}`,
        label: brand.title,
    }));

/**
 * Resolve a stored icon key to its component. Keys are namespaced:
 * `social:<slug>` for brand glyphs, `h:<name>` / `solid:h:<name>` for the
 * Heroicons catalog, anything else falls through to the legacy map and
 * finally to a friendly default so a blank or stale value never breaks a page.
 */
export function resolveIcon(key?: string | null): AppIconComponent {
    if (!key) return FALLBACK_ICON;
    return (
        HERO_REGISTRY[key] ??
        SOCIAL_REGISTRY[key] ??
        LEGACY_ICONS[key] ??
        FALLBACK_ICON
    );
}

/** Whether a key names a real glyph (vs. blank or an unresolved catalog key). */
export function iconIsKnown(key?: string | null): boolean {
    if (!key) return false;
    return key in HERO_REGISTRY || key in SOCIAL_REGISTRY || key in LEGACY_ICONS;
}

/** Readable label for any key: brand titles win, other keys are de-prefixed. */
export function iconLabel(key?: string | null): string {
    if (!key) return '';
    const brand = BRAND_ICONS.find((b) => `social:${b.slug}` === key);
    if (brand) return brand.title;
    const bare = key.replace(/^solid:/, '').replace(/^h:/, '');
    return bare
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

/**
 * Load (once) the generated Heroicons catalog — registers every glyph with
 * `resolveIcon` and resolves with the entries the picker renders. Kept out of
 * this module's static imports so the ~300-icon chunk stays code-split.
 */
export type HeroIconCatalogEntry = {
    key: string;
    label: string;
    category: string;
    o: HeroIconComponent | null;
    s: HeroIconComponent | null;
};

let catalogPromise: Promise<HeroIconCatalogEntry[]> | null = null;

export function loadIconCatalog(): Promise<HeroIconCatalogEntry[]> {
    catalogPromise ??= import('@/lib/hero-catalog').then((m) => m.HERO_ICONS);
    return catalogPromise;
}
