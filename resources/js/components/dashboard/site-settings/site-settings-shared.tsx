import { type ReactNode } from 'react';
import type { HomeFeature, HomeStat } from '@/types';

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
export const FEATURE_ICONS: Array<{ value: string; label: string }> = [
    { value: 'faculty', label: 'Faculty (people)' },
    { value: 'values', label: 'Values (heart)' },
    { value: 'facilities', label: 'Facilities (building)' },
    { value: 'classes', label: 'Classes (graduation)' },
];

export interface SiteSettingRecord {
    id?: number;
    brand_name: string;
    brand_short_name: string;
    tagline?: string | null;
    logo_url?: string | null;
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

export function buildEmbedUrl(lat: number, lng: number, zoom: number): string {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <fieldset className="grid gap-3 rounded-xl border p-4">
            <legend className="px-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {title}
            </legend>
            {children}
        </fieldset>
    );
}
