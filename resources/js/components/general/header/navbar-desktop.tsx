import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dropdown from '@/components/general/header/nav-dropdown';
import { isNavigationItemActive } from '@/components/general/header/navbar-utils';
import type { NavigationItem } from '@/lib/navigation';

interface NavbarDesktopProps {
    items: NavigationItem[];
    currentUrl: string;
    isSticky: boolean;
}

function DesktopNavItem({
    item,
    currentUrl,
    isSticky,
}: {
    item: NavigationItem;
    currentUrl: string;
    isSticky: boolean;
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { t } = useTranslation();
    const Icon = item.icon;
    const isActive = isNavigationItemActive(item, currentUrl);

    const sharedClassName = `group flex items-center gap-x-2 rounded-xl p-2 text-sm transition-all duration-300 ${
        isActive
            ? 'border border-white/40 bg-white/30 font-medium text-blue-600 dark:border-gray-700/40 dark:bg-gray-800/30 dark:text-blue-400'
            : isSticky
              ? 'text-white hover:border hover:border-white/30 hover:bg-white/20'
              : 'text-slate-700 hover:border hover:border-gray-200/30 hover:bg-white/20 dark:text-slate-300 dark:hover:border-gray-700/30 dark:hover:bg-gray-800/20'
    }`;

    return (
        <li className="relative">
            {item.dropdown ? (
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen((value) => !value)}
                        className={sharedClassName}
                    >
                        <div
                            className={`rounded-lg p-1.5 transition-colors duration-300 ${
                                isActive
                                    ? 'bg-white/40 dark:bg-gray-800/40'
                                    : 'bg-white/20 group-hover:bg-white/30 dark:bg-gray-800/20 dark:group-hover:bg-gray-800/30'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                        </div>
                        <span>{t(item.nameKey)}</span>
                        <ChevronDownIcon
                            className={`h-3.5 w-3.5 transition-transform duration-300 ${
                                isDropdownOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    <Dropdown
                        items={item.dropdown}
                        isOpen={isDropdownOpen}
                        onClose={() => setIsDropdownOpen(false)}
                        isSticky={isSticky}
                    />
                </div>
            ) : (
                <Link href={item.href} className={sharedClassName}>
                    <div
                        className={`rounded-lg p-1.5 transition-colors duration-300 ${
                            isActive
                                ? 'bg-white/40 dark:bg-gray-800/40'
                                : 'bg-white/20 group-hover:bg-white/30 dark:bg-gray-800/20 dark:group-hover:bg-gray-800/30'
                        }`}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                    <span>{t(item.nameKey)}</span>
                </Link>
            )}
        </li>
    );
}

export default function NavbarDesktop({
    items,
    currentUrl,
    isSticky,
}: NavbarDesktopProps) {
    return (
        <div className="hidden lg:block">
            <ul className="flex items-center gap-1">
                {items.map((item) => (
                    <DesktopNavItem
                        key={item.key}
                        item={item}
                        currentUrl={currentUrl}
                        isSticky={isSticky}
                    />
                ))}
            </ul>
        </div>
    );
}

