import { CheckIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setKnownLanguages } from '@/i18n';
import { navIconButtonClass } from '@/components/general/header/navbar-styles';
import type { LanguageOption, SharedData } from '@/types';

interface LanguageSwitcherProps {
    className?: string;
}

export default function LanguageSwitcher({
    className = '',
}: LanguageSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { i18n } = useTranslation();
    const { languages } = usePage<SharedData>().props;

    const available: LanguageOption[] =
        languages?.available && languages.available.length > 0
            ? languages.available
            : [{ code: i18n.language, name: i18n.language.toUpperCase(), dir: 'ltr' }];

    // Keep text direction / fallback in sync with the admin-managed languages.
    useEffect(() => {
        if (languages?.available?.length) {
            setKnownLanguages(languages.available, languages.default);
        }
    }, [languages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const changeLanguage = (language: string) => {
        void i18n.changeLanguage(language);
        setIsOpen(false);

        // The SetLocale middleware reads the cookie to re-localize server-rendered
        // content and the <html dir>, so reload after the switcher writes it.
        router.reload();
    };

    const currentLanguage = available.find(({ code }) => code === i18n.language);

    return (
        <div ref={menuRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                aria-label={i18n.language ? `Language (${currentLanguage ? currentLanguage.name : i18n.language})` : 'Language'}
                title={currentLanguage ? currentLanguage.name : 'Language'}
                className={navIconButtonClass}
            >
                <LanguageIcon className="h-5 w-5" />
            </button>

            {isOpen && (
                <div
                    className="absolute end-0 z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-gray-200/50 bg-white/95 p-1 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
                >
                    {available.map((option) => {
                        const isActive = i18n.language === option.code;

                        return (
                            <button
                                key={option.code}
                                type="button"
                                onClick={() => changeLanguage(option.code)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-sm transition-colors ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-600 dark:bg-gray-800/80 dark:text-blue-400'
                                        : 'hover:bg-slate-100/80 dark:hover:bg-gray-800/40'
                                }`}
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
