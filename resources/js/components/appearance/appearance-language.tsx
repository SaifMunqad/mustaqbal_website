/**
 * Combined appearance + language control for the public shell.
 *
 * Mirrors the admin-managed language list from the shared props, falling back to
 * the single active locale when the server sends none, and keeps the i18n
 * runtime's known-language table in sync so direction changes are applied
 * consistently.
 */
import { CheckIcon } from '@heroicons/react/24/outline';
import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { setKnownLanguages } from '@/i18n';
import { cn } from '@/lib/utils';
import type { LanguageOption, SharedData } from '@/types';

export default function AppearanceLanguage() {
    const { i18n } = useTranslation();
    const { languages } = usePage<SharedData>().props;

    const available: LanguageOption[] =
        languages?.available && languages.available.length > 0
            ? languages.available
            : [
                  {
                      code: i18n.language,
                      name: i18n.language.toUpperCase(),
                      dir: 'ltr',
                  },
              ];

    // Keep text direction / fallback in sync with the admin-managed languages.
    useEffect(() => {
        if (languages?.available?.length) {
            setKnownLanguages(languages.available, languages.default);
        }
    }, [languages]);

    const selectLanguage = (code: string) => {
        if (code === i18n.language) {
            return;
        }

        // Changing the language triggers the i18n `languageChanged` listener,
        // which writes the value to localStorage and the locale cookie the
        // backend SetLocale middleware reads. Reload so server-rendered content
        // and <html dir> follow the new selection.
        void i18n.changeLanguage(code);
        router.reload();
    };

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {available.map((option) => {
                const isActive = i18n.language === option.code;

                return (
                    <button
                        key={option.code}
                        type="button"
                        onClick={() => selectLanguage(option.code)}
                        aria-pressed={isActive}
                        className={cn(
                            'flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                            isActive
                                ? 'border-transparent bg-primary text-primary-foreground shadow-xs'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100/60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700/60',
                        )}
                    >
                        <span>{option.name}</span>
                        {isActive && <CheckIcon className="h-4 w-4" />}
                    </button>
                );
            })}
        </div>
    );
}
