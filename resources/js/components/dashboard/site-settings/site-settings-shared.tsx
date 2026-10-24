import type { HomeFeature, HomeStat, TintDepth } from '@/types';
import { type ReactNode } from 'react';

// Shared control styling for the inline repeatable stats/features editors, kept
// consistent with the plain TextField look used elsewhere on this page.
export const rowInputClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-gray-900 dark:text-slate-100';
// Danger-tinted inline row button, used for destructive actions
// (e.g. removing a quick stat or feature) so it reads as a delete control.
export const rowRemoveButtonClass =
    'shrink-0 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40';

// Feature icon keys offered to the admin; must match ICON_MAP in
// components/home/feature-grid.tsx so the chosen icon actually renders.
// Labels are i18n keys resolved in the editor.
export const FEATURE_ICONS: Array<{ value: string; labelKey: string }> = [
    {
        value: 'faculty',
        labelKey: 'dashboard.settings.form.featureIconFaculty',
    },
    {
        value: 'values',
        labelKey: 'dashboard.settings.form.featureIconValues',
    },
    {
        value: 'facilities',
        labelKey: 'dashboard.settings.form.featureIconFacilities',
    },
    {
        value: 'classes',
        labelKey: 'dashboard.settings.form.featureIconClasses',
    },
];

export interface SiteSettingRecord {
    id?: number;
    brand_name: string;
    brand_short_name: string;
    tagline?: string | null;
    logo_url?: string | null;
    brand_color?: string | null;
    accent_color?: string | null;
    tint_depth?: TintDepth | null;
    reverse_logo_url?: string | null;
    home_title?: string | null;
    home_subtitle?: string | null;
    home_cta_primary?: string | null;
    home_cta_secondary?: string | null;
    home_hero_image?: string | null;
    home_stats?: HomeStat[] | null;
    home_features?: HomeFeature[] | null;
    contact_email?: string | null;
    contact_phone_primary?: string | null;
    contact_phone_secondary?: string | null;
    address?: string | null;
    map_latitude?: number | null;
    map_longitude?: number | null;
    map_zoom?: number | null;
    map_embed_url?: string | null;
    social_facebook?: string | null;
    social_instagram?: string | null;
    social_twitter?: string | null;
    social_youtube?: string | null;
    social_whatsapp?: string | null;
    footer_text?: string | null;
}

// Branding tint depths, in increasing strength. Kept next to the shared record
// so the editor, the preview and the backend rule list stay in sync.
export const TINT_DEPTHS: TintDepth[] = ['subtle', 'medium', 'bold'];

// i18n keys for the depth labels, resolved in the editor.
export const TINT_DEPTH_LABELS: Record<TintDepth, string> = {
    subtle: 'dashboard.settings.form.tintSubtle',
    medium: 'dashboard.settings.form.tintMedium',
    bold: 'dashboard.settings.form.tintBold',
};

export function buildEmbedUrl(lat: number, lng: number, zoom: number): string {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

export function Group({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <fieldset className="grid gap-3 rounded-xl border p-4">
            <legend className="px-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {title}
            </legend>
            {children}
        </fieldset>
    );
}
