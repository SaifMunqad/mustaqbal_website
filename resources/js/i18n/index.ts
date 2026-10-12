import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from '@/i18n/locales/ar';
import en from '@/i18n/locales/en';
import faAF from '@/i18n/locales/fa_AF';
import ps from '@/i18n/locales/ps';

const STORAGE_KEY = 'mustaqbal.language';
const LOCALE_COOKIE = 'mustaqbal_locale';

// Static bundles that ship with the app provide the UI-chrome strings. Codes
// without a bundle fall back to `defaultLanguage` for chrome while still being
// usable for database-driven content and text direction.
const resources = {
    en: { translation: en },
    ps: { translation: ps },
    fa_AF: { translation: faAF },
    ar: { translation: ar },
};

const defaultLanguage = 'en';

// Text direction per language code. Seeded with the known bundles and kept in
// sync with the backend `languages` table at runtime (see setKnownLanguages).
const dirByCode: Record<string, string> = {
    en: 'ltr',
    ps: 'rtl',
    fa_AF: 'rtl',
    ar: 'rtl',
};

const readCookie = (name: string): string | null => {
    if (typeof document === 'undefined') {
        return null;
    }

    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));

    return match ? decodeURIComponent(match[2]) : null;
};

const rememberLanguage = (language: string): void => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, language);
    document.cookie = `${LOCALE_COOKIE}=${language}; path=/; max-age=31536000; SameSite=Lax`;
};

const resolveLanguage = (): string => {
    if (typeof window === 'undefined') {
        return defaultLanguage;
    }

    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);

    // Prefer an explicit cached choice; otherwise fall back to the cookie the
    // server sets on a visitor's first request so the browser cache is seeded.
    if (storedLanguage) {
        return storedLanguage;
    }

    const cookieLanguage = readCookie(LOCALE_COOKIE);

    if (cookieLanguage) {
        window.localStorage.setItem(STORAGE_KEY, cookieLanguage);

        return cookieLanguage;
    }

    return defaultLanguage;
};

const resolveFontFamily = (language: string): 'tajawal' | 'rubik' =>
    dirByCode[language] === 'rtl' ? 'rubik' : 'tajawal';

const applyDocumentLanguage = (language: string) => {
    if (typeof document === 'undefined') {
        return;
    }

    const dir = dirByCode[language] ?? 'ltr';

    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.documentElement.dataset.appFont = resolveFontFamily(language);
};

/**
 * Merge the backend-managed language list so newly added languages and any
 * direction changes are reflected without a rebuild.
 *
 * @param languages active languages shared by the Inertia middleware.
 * @param fallback the default language code to fall back to.
 */
export const setKnownLanguages = (
    languages: Array<{ code: string; dir: string }>,
    fallback?: string,
): void => {
    languages.forEach(({ code, dir }) => {
        dirByCode[code] = dir === 'rtl' ? 'rtl' : 'ltr';
    });

    if (fallback) {
        i18n.options.fallbackLng = [fallback, defaultLanguage];
    }

    applyDocumentLanguage(i18n.language);
};

/**
 * Seed the browser cache from the server-resolved language on first load and
 * keep text direction / fallback in sync with the admin-managed languages.
 *
 * @param languages the shared language state (available list, current, default).
 */
export const bootstrapLanguage = (
    languages?: { available: Array<{ code: string; dir: string }>; current: string; default: string },
): void => {
    if (!languages || !languages.available?.length || typeof window === 'undefined') {
        return;
    }

    setKnownLanguages(languages.available, languages.default);

    const activeCodes = languages.available.map(({ code }) => code);
    const stored = window.localStorage.getItem(STORAGE_KEY);

    // Reuse a valid cached choice; otherwise adopt the server's current locale
    // (the first-priority language for new visitors) and cache it.
    if (!stored || !activeCodes.includes(stored)) {
        const initial = activeCodes.includes(languages.current) ? languages.current : activeCodes[0];

        rememberLanguage(initial);

        if (i18n.language !== initial) {
            void i18n.changeLanguage(initial);
        }
    }
};

if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        resources,
        lng: resolveLanguage(),
        fallbackLng: [defaultLanguage],
        interpolation: {
            escapeValue: false,
        },
    });

    i18n.on('languageChanged', (language: string) => {
        applyDocumentLanguage(language);

        if (typeof window !== 'undefined') {
            rememberLanguage(language);
        }
    });

    applyDocumentLanguage(i18n.language);
}

export default i18n;
