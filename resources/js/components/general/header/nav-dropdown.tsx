import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import type { NavigationChildItem } from '@/lib/navigation';

export default function Dropdown({
    items,
    isOpen,
    onClose,
    isSticky,
}: {
    items: NavigationChildItem[];
    isOpen: boolean;
    onClose: () => void;
    isSticky: boolean;
}) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { url } = usePage();
    const { t } = useTranslation();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute left-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200/50 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
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
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                                    : 'hover:bg-slate-100/70 dark:hover:bg-gray-800/70'
                            }`}
                        >
                            <div
                                className={`rounded-lg p-2 ${
                                    isActive
                                        ? 'bg-blue-100 dark:bg-blue-900/40'
                                        : 'bg-slate-100 group-hover:bg-slate-200 dark:bg-gray-800 dark:group-hover:bg-gray-700'
                                }`}
                            >
                                <Icon
                                    className={`h-4 w-4 ${
                                        isActive
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p
                                    className={`truncate text-sm font-medium ${
                                        isActive
                                            ? 'text-blue-600 dark:text-blue-400'
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
                                <div className="ml-2 h-4 w-1 rounded-full bg-blue-500/50" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}