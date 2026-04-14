import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from '@/i18n/locales/ar';
import en from '@/i18n/locales/en';
import faAF from '@/i18n/locales/fa_AF';
import ps from '@/i18n/locales/ps';
import type { LanguageCode } from '@/lib/navigation';

const STORAGE_KEY = 'mustaqbal.language';
const fallbackLanguage: LanguageCode = 'en';
const supportedLanguages: LanguageCode[] = ['en', 'ps', 'fa_AF', 'ar'];

const resources = {
    en: { translation: en },
    ps: { translation: ps },
    fa_AF: { translation: faAF },
    ar: { translation: ar },
};

const isSupportedLanguage = (value: string): value is LanguageCode =>
    supportedLanguages.includes(value as LanguageCode);

const resolveLanguage = (): LanguageCode => {
    if (typeof window === 'undefined') {
        return fallbackLanguage;
    }

    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (storedLanguage && isSupportedLanguage(storedLanguage)) {
        return storedLanguage;
    }

    return fallbackLanguage;
};

export const isRtlLanguage = (language: string): boolean =>
    language === 'ps' || language === 'fa_AF' || language === 'ar';

const resolveFontFamily = (language: string): 'tajawal' | 'rubik' =>
    isRtlLanguage(language) ? 'rubik' : 'tajawal';

const applyDocumentLanguage = (language: string) => {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.lang = language;
    document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr';
    document.documentElement.dataset.appFont = resolveFontFamily(language);
};

if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        resources,
        lng: resolveLanguage(),
        fallbackLng: fallbackLanguage,
        interpolation: {
            escapeValue: false,
        },
    });

    i18n.on('languageChanged', (language: string) => {
        applyDocumentLanguage(language);
        if (typeof window !== 'undefined' && isSupportedLanguage(language)) {
            window.localStorage.setItem(STORAGE_KEY, language);
        }
    });

    applyDocumentLanguage(i18n.language);
}

export default i18n;
