import {
    CheckIcon,
    ChevronDownIcon,
    LanguageIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languageOptions, type LanguageCode } from '@/lib/navigation';

interface LanguageSwitcherProps {
    isSticky: boolean;
    className?: string;
}

export default function LanguageSwitcher({
    isSticky,
    className = '',
}: LanguageSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { i18n, t } = useTranslation();

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

    const changeLanguage = (language: LanguageCode) => {
        void i18n.changeLanguage(language);
        setIsOpen(false);
    };

    const currentLanguage = languageOptions.find(
        ({ code }) => code === i18n.language,
    )?.labelKey;

    return (
        <div ref={menuRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                className={`flex items-center gap-x-2 rounded-xl border p-2 text-sm transition-all duration-300 ${
                    isSticky
                        ? 'border-white/30 bg-white/20 text-white hover:bg-white/30'
                        : 'border-gray-200/30 bg-white/20 text-slate-700 hover:bg-white/30 dark:border-gray-700/30 dark:bg-gray-800/20 dark:text-slate-300 dark:hover:bg-gray-800/30'
                }`}
            >
                <LanguageIcon className="h-4 w-4" />
                <span>{currentLanguage ? t(currentLanguage) : t('language.label')}</span>
                <ChevronDownIcon
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {isOpen && (
                <div
                    className={`absolute right-0 z-50 mt-2 min-w-44 overflow-hidden rounded-xl border p-1 shadow-xl ${
                        isSticky
                            ? 'border-white/30 bg-white/20 backdrop-blur-lg'
                            : 'border-gray-200/30 bg-white/20 backdrop-blur-lg dark:border-gray-700/30 dark:bg-gray-900/40'
                    }`}
                >
                    {languageOptions.map((option) => {
                        const isActive = i18n.language === option.code;

                        return (
                            <button
                                key={option.code}
                                type="button"
                                onClick={() => changeLanguage(option.code)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                    isActive
                                        ? 'bg-white/40 text-blue-600 dark:bg-gray-800/50 dark:text-blue-400'
                                        : 'hover:bg-white/30 dark:hover:bg-gray-800/30'
                                }`}
                            >
                                <span>{t(option.labelKey)}</span>
                                {isActive && <CheckIcon className="h-4 w-4" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

