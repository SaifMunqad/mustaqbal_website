import {
    CalendarDaysIcon,
    CheckIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DATE_TYPE_OPTIONS, type DateType } from '@/lib/date-type';
import { cn } from '@/lib/utils';

interface DateTypeSwitcherProps {
    value: DateType;
    onChange: (value: DateType) => void;
    className?: string;
}

/**
 * Date-type picker styled after the header's language switcher: a compact
 * trigger that opens a check-marked menu, with click-outside dismissal.
 */
export default function DateTypeSwitcher({
    value,
    onChange,
    className,
}: DateTypeSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

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

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const current =
        DATE_TYPE_OPTIONS.find((option) => option.value === value) ??
        DATE_TYPE_OPTIONS[0];

    const selectDateType = (next: DateType) => {
        onChange(next);
        setIsOpen(false);
    };

    return (
        <div ref={menuRef} className={cn('relative', className)}>
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={t('events.dateType')}
                title={t('events.dateType')}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200/70 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-blue-900/60 dark:bg-gray-900/70 dark:text-slate-200 dark:hover:bg-gray-900"
            >
                <CalendarDaysIcon className="size-5 text-blue-600 dark:text-blue-400" />
                <span>{t(current.labelKey)}</span>
                <ChevronDownIcon
                    className={cn(
                        'size-4 transition-transform',
                        isOpen && 'rotate-180',
                    )}
                />
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    aria-label={t('events.dateType')}
                    className="absolute end-0 z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-gray-200/50 bg-white/95 p-1 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
                >
                    {DATE_TYPE_OPTIONS.map((option) => {
                        const isActive = option.value === value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                onClick={() => selectDateType(option.value)}
                                className={cn(
                                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-sm transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-600 dark:bg-gray-800/80 dark:text-blue-400'
                                        : 'hover:bg-slate-100/80 dark:hover:bg-gray-800/40',
                                )}
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
