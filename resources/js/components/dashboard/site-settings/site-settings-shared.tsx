import type {
    TranslatableField,
    TranslationValues,
} from '@/components/language-tabs-editor';
import type {
    HomeFeature,
    HomeStat,
    LanguageOption,
    SharedData,
    TintDepth,
} from '@/types';

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

/** Existing translations keyed by `code -> field -> value`, sent by the controller. */
export type SettingsTranslations = Record<
    string,
    {
        brand_name?: string;
        brand_short_name?: string;
        tagline?: string;
        home_title?: string;
        home_subtitle?: string;
        home_cta_primary?: string;
        home_cta_secondary?: string;
        footer_text?: string;
        home_stats?: HomeStat[];
        home_features?: HomeFeature[];
    }
>;

/** Props the settings controller sends to the dashboard edit page. */
export interface SiteSettingsPageProps extends SharedData {
    settings: SiteSettingRecord;
    translations: SettingsTranslations;
    mapsKey?: string | null;
}

/**
 * A save scope on the settings page. Sections are validated and persisted one at
 * a time, so this list mirrors DashboardSiteSettingController::SECTIONS.
 */
export type SettingsSectionKey =
    | 'identity'
    | 'appearance'
    | 'home'
    | 'contact'
    | 'social';

export const SETTINGS_SECTION_KEYS: SettingsSectionKey[] = [
    'identity',
    'appearance',
    'home',
    'contact',
    'social',
];

/** Section heading copy, shared by the tab strip and the panel header. */
export const SECTION_COPY: Record<
    SettingsSectionKey,
    { titleKey: string; descriptionKey: string }
> = {
    identity: {
        titleKey: 'dashboard.settings.form.brandingTitle',
        descriptionKey: 'dashboard.settings.form.identityDescription',
    },
    appearance: {
        titleKey: 'dashboard.settings.form.appearanceTitle',
        descriptionKey: 'dashboard.settings.form.appearanceDescription',
    },
    home: {
        titleKey: 'dashboard.settings.form.homePageTitle',
        descriptionKey: 'dashboard.settings.form.homeDescription',
    },
    contact: {
        titleKey: 'dashboard.settings.form.contactTitle',
        descriptionKey: 'dashboard.settings.form.contactDescription',
    },
    social: {
        titleKey: 'dashboard.settings.form.socialTitle',
        descriptionKey: 'dashboard.settings.form.socialDescription',
    },
};

/**
 * Seed the scalar tabs editor from saved translations, falling back to the
 * parent (default-language) values for the default language so the editor shows
 * the current English copy before any translation row exists.
 */
export function seedScalars(
    available: LanguageOption[],
    translations: SettingsTranslations,
    settings: SiteSettingRecord,
    defaultCode: string,
    scalarFields: TranslatableField[],
): TranslationValues {
    const fields = scalarFields.map((field) => field.name);
    const out: TranslationValues = {};

    for (const language of available) {
        const saved = translations[language.code] ?? {};
        const isDefault = language.code === defaultCode;

        out[language.code] = {};
        for (const field of fields) {
            const savedValue =
                saved[field as keyof SettingsTranslations[string]];
            const fallback = isDefault
                ? (settings[field as keyof SiteSettingRecord] ?? '')
                : '';
            out[language.code][field] =
                typeof savedValue === 'string'
                    ? savedValue
                    : String(fallback ?? '');
        }
    }

    return out;
}

/**
 * Seed a localized list per language, falling back to the parent's default list
 * when that language has no saved rows yet.
 */
export function seedLists<T extends HomeStat | HomeFeature>(
    available: LanguageOption[],
    translations: SettingsTranslations,
    settings: SiteSettingRecord,
    key: 'home_stats' | 'home_features',
): Record<string, T[]> {
    const fallback = (settings[key] ?? []) as T[];
    const out: Record<string, T[]> = {};

    for (const language of available) {
        out[language.code] =
            (translations[language.code]?.[key] as T[] | undefined) ?? fallback;
    }

    return out;
}
