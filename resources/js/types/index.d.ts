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
    title: string;
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

export interface SiteSettings {
    brand_name: string;
    brand_short_name: string;
    tagline?: string | null;
    logo_url?: string | null;
    favicon_url?: string | null;
    home: {
        title?: string | null;
        subtitle?: string | null;
        cta_primary?: string | null;
        cta_secondary?: string | null;
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
