/** Compact language picker for the public navbar. */
import { navIconButtonClass } from '@/components/general/header/navbar-styles';
import { CheckIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { setKnownLanguages } from '@/i18n';
import type { LanguageOption, SharedData } from '@/types';

export default function LanguageSwitcher() {
    const { i18n, t } = useTranslation();
    const { languages } = usePage<SharedData>().props;
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
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

    useEffect(() => {
        if (languages?.available?.length) {
            setKnownLanguages(languages.available, languages.default);
        }
    }, [languages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const selectLanguage = (code: string) => {
        setIsOpen(false);
        if (code !== i18n.language) {
            void i18n.changeLanguage(code);
            router.reload();
        }
    };

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={t('language.label')}
                title={t('language.label')}
                className={`${navIconButtonClass} ${isOpen ? 'border-brand ring-2 ring-brand/25' : ''}`}
            >
                <LanguageIcon className="h-5 w-5" />
            </button>
            {isOpen && (
                <div
                    role="listbox"
                    aria-label={t('language.label')}
                    className="absolute end-0 z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-brand-border/50 bg-white/95 p-1 text-gray-800 shadow-xl backdrop-blur-xl dark:bg-[#121212]/95 dark:text-gray-200"
                >
                    {available.map((option) => {
                        const isActive = option.code === i18n.language;
                        return (
                            <button
                                key={option.code}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                onClick={() => selectLanguage(option.code)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-sm transition-colors ${isActive ? 'bg-brand-soft text-brand-ink' : 'hover:bg-brand-soft/80 dark:hover:bg-gray-800/40'}`}
                            >
                                <span>{option.name}</span>
                                {isActive && <CheckIcon className="h-4 w-4" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
