/**
 * Dropdown that picks which calendar a date should be read in (Gregorian,
 * Solar Hijri or Lunar Hijri).
 *
 * Selection is presentation-only: the stored date never changes, the caller
 * re-formats what it displays. Closes on outside click and Escape.
 */
import { CalendarDaysIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { navIconButtonClass } from '@/components/general/header/navbar-styles';
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
 *
 * Every color is a brand token (`brand`, `brand-ink`, `brand-soft`, …) fed by
 * the admin's saved branding palette, so the control inherits the school's
 * brand color automatically on both the public navbar and the dashboard.
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
                title={`${t('events.dateType')}: ${t(current.labelKey)}`}
                className={cn(
                    navIconButtonClass,
                    isOpen && 'border-brand ring-2 ring-brand/25',
                )}
            >
                <CalendarDaysIcon className="h-5 w-5" />
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    aria-label={t('events.dateType')}
                    className="absolute end-0 z-50 mt-2 min-w-48 overflow-hidden rounded-xl border border-brand-border/50 bg-white/95 p-1 text-gray-800 shadow-xl backdrop-blur-xl dark:bg-[#121212]/95 dark:text-gray-200"
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
                                        ? 'bg-brand-soft text-brand-ink'
                                        : 'hover:bg-brand-soft/80 dark:hover:bg-gray-800/40',
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
