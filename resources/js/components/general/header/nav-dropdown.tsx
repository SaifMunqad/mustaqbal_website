import type { NavigationChildItem } from '@/lib/navigation';
import { Link, usePage } from '@inertiajs/react';
import { RefObject, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function NavDropdown({
    items,
    isOpen,
    onClose,
    containerRef,
}: {
    items: NavigationChildItem[];
    isOpen: boolean;
    onClose: () => void;
    // A ref wrapping both the trigger button and the dropdown panel so that
    // clicking the trigger toggles cleanly instead of being treated as an
    // outside click (which would close then immediately re-open it).
    containerRef?: RefObject<HTMLDivElement | null>;
}) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { url } = usePage();
    const { t } = useTranslation();

    // Close dropdown when clicking outside the trigger + panel container.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const container = containerRef?.current ?? dropdownRef.current;
            if (container && !container.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, containerRef]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute start-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-brand-border/50 bg-white/95 p-2 shadow-xl backdrop-blur-xl"
        >
            <div className="p-1">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = url === item.href;

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            onClick={onClose}
                            className={`group flex items-start gap-x-3 rounded-xl p-3 transition-all duration-200 ${
                                isActive
                                    ? 'bg-brand-soft text-brand-ink dark:bg-brand-deep/40'
                                    : 'hover:bg-brand-soft/70 dark:hover:bg-gray-800/70'
                            }`}
                        >
                            <div
                                className={`rounded-lg p-2 ${
                                    isActive
                                        ? 'bg-brand-soft-strong dark:bg-brand-deep/40'
                                        : 'bg-brand-soft group-hover:bg-slate-200 dark:group-hover:bg-gray-700'
                                }`}
                            >
                                <Icon
                                    className={`h-4 w-4 ${
                                        isActive
                                            ? 'text-brand-ink'
                                            : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p
                                    className={`truncate text-sm font-medium ${
                                        isActive
                                            ? 'text-brand-ink'
                                            : 'text-gray-800 dark:text-gray-200'
                                    }`}
                                >
                                    {t(item.nameKey)}
                                </p>
                                {item.descriptionKey && (
                                    <p className="mt-1 truncate text-xs opacity-75">
                                        {t(item.descriptionKey)}
                                    </p>
                                )}
                            </div>

                            {isActive && (
                                <div className="ms-2 h-4 w-1 rounded-full bg-brand/50" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
