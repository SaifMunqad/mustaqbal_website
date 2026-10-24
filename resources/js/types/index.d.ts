import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    /** i18n key for the group's label; the label is hidden in icon-collapsed mode. */
    titleKey: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface HomeStat {
    value: string;
    label: string;
}

export interface HomeFeature {
    icon?: string | null;
    title: string;
    description: string;
}

/** How strongly brand color is tinted into sections and cards. */
export type TintDepth = 'subtle' | 'medium' | 'bold';

/**
 * Server-derived branding tokens, split per color scheme. Keys are CSS custom
 * property names (e.g. `--brand-soft`) so they can be applied directly as an
 * inline `style` object to scope a preview subtree.
 */
export interface BrandPalette {
    light: Record<string, string>;
    dark: Record<string, string>;
    contrast: {
        on_brand: number;
        on_page: number;
        on_dark_brand: number;
        on_dark_page: number;
    };
}

export interface SiteSettings {
    brand_name: string;
    brand_short_name: string;
    tagline?: string | null;
    logo_url?: string | null;
    favicon_url?: string | null;
    /**
     * Branding palette: the admin-supplied inputs plus the CSS tokens the server
     * derives from them (see App\Support\Theme\BrandPalette). The page
     * background is frozen and is NOT part of this payload.
     */
    theme: {
        brand_color?: string | null;
        accent_color?: string | null;
        tint_depth: TintDepth;
        reverse_logo_url?: string | null;
        palette: BrandPalette;
    };
    home: {
        title?: string | null;
        subtitle?: string | null;
        cta_primary?: string | null;
        cta_secondary?: string | null;
        cta_primary_url?: string | null;
        cta_secondary_url?: string | null;
        hero_image?: string | null;
    };
    stats?: HomeStat[];
    features?: HomeFeature[];
    contact?: {
        email?: string | null;
        phone_primary?: string | null;
        phone_secondary?: string | null;
        address?: string | null;
        map_latitude?: number | null;
        map_longitude?: number | null;
        map_zoom?: number | null;
        map_embed_url?: string | null;
    };
    social: {
        facebook?: string | null;
        instagram?: string | null;
        twitter?: string | null;
        youtube?: string | null;
        whatsapp?: string | null;
    };
    footer_text?: string | null;
}

export interface LanguageOption {
    code: string;
    name: string;
    dir: 'ltr' | 'rtl';
}

/**
 * Laravel length-aware paginator as serialized into Inertia props. The
 * infinite-scroll hook appends pages through `next_page_url`, so the other
 * fields only mirror what the framework sends.
 */
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    first_page_url: string;
    last_page_url: string;
    path: string;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    site: SiteSettings;
    languages?: {
        available: LanguageOption[];
        current: string;
        default: string;
    };
    flash?: {
        notification?: {
            id: string;
            variant: 'success' | 'error' | 'info';
            title: string;
            description?: string | null;
            params?: Record<string, string | number> | null;
        } | null;
    };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'family' | 'teacher' | 'management' | 'admin';
    status?: 'pending' | 'active' | 'suspended';
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
