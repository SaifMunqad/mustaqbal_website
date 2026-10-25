import type {
    TranslatableField,
    TranslationValues,
} from '@/components/editor/language-tabs-editor';
import type { LanguageOption, SharedData, TintDepth } from '@/types';

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
        footer_text?: string;
    }
>;

/** Props the settings controller sends to the dashboard edit page. */
export interface FontFileRecord {
    weight: number;
    style: string;
    url: string;
    format: string;
}

export interface FontFamilyRecord {
    id: number;
    name: string;
    /** CSS-safe family name used inside @font-face/font-family. */
    family: string;
    /** Complete font-family stack including the built-in fallbacks. */
    stack: string;
    files: FontFileRecord[];
    /** Language codes currently using this family. */
    languages: string[];
}

export interface GoogleFontRecord {
    key: string;
    name: string;
    /** Complete font-family stack including the built-in fallbacks. */
    stack: string;
    /** Whether the family ships Arabic glyphs (only Rubik does today). */
    arabic: boolean;
    /** Google Fonts stylesheet for this family alone. */
    href: string;
}

export interface LanguageTypographyRecord {
    id: number;
    code: string;
    name: string;
    dir: 'ltr' | 'rtl';
    is_active: boolean;
    font_family_id: number | null;
    /** Curated Google Font key, mutually exclusive with font_family_id. */
    google_font: string | null;
}

export interface SiteSettingsPageProps extends SharedData {
    settings: SiteSettingRecord;
    translations: SettingsTranslations;
    mapsKey?: string | null;
    /** Uploaded font families available for per-language selection. */
    fonts: FontFamilyRecord[];
    /** Every language with the family it currently uses. */
    typography: LanguageTypographyRecord[];
    /** Curated free Google Fonts offered as ready-made choices. */
    googleFonts: GoogleFontRecord[];
    /** Combined Google Fonts stylesheet used only to render the previews. */
    googleFontsHref: string;
}

/**
 * A save scope on the settings page. Sections are validated and persisted one at
 * a time, so this list mirrors DashboardSiteSettingController::SECTIONS. The
 * home page is not one of them: its layout is composed in the page builder.
 */
export type SettingsSectionKey =
    | 'identity'
    | 'appearance'
    | 'contact'
    | 'social';

export const SETTINGS_SECTION_KEYS: SettingsSectionKey[] = [
    'identity',
    'appearance',
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
