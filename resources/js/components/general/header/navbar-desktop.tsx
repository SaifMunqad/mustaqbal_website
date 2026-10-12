import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { useRef, useState } from 'react';
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
    const containerRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const Icon = item.icon;
    const isActive = isNavigationItemActive(item, currentUrl);

    const sharedClassName = `group flex items-center gap-x-2 rounded-xl py-1 px-4 text-sm transition-all duration-300 ${
        isActive
            ? 'border border-blue-500/30 bg-blue-500/10 font-medium text-blue-600 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-400'
            : 'text-slate-700 border border-transparent hover:border-gray-200/40 hover:bg-slate-100/60 dark:text-slate-200 dark:hover:border-gray-700/40 dark:hover:bg-gray-800/40'
    }`;

    // Reusable icon wrapper styles for consistency
    const iconWrapperClassName = `flex items-center justify-center rounded-lg p-1 transition-colors duration-300 ${
        isActive
            ? 'bg-white/40 dark:bg-gray-800/40'
            : 'bg-white/20 group-hover:bg-white/30 dark:bg-gray-800/20 dark:group-hover:bg-gray-800/30'
    }`;

    return (
        <li className="relative">
            {item.dropdown ? (
                <div className="relative" ref={containerRef}>
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen((value) => !value)}
                        className={sharedClassName}
                    >
                        <div className={iconWrapperClassName}>
                            <Icon className="size-4" />
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
                        containerRef={containerRef}
                    />
                </div>
            ) : (
                <Link href={item.href} className={sharedClassName}>
                    <div className={iconWrapperClassName}>
                        <Icon className="size-4" />
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