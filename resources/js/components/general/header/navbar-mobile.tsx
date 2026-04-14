import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { isNavigationItemActive } from '@/components/general/header/navbar-utils';
import type { NavigationChildItem, NavigationItem } from '@/lib/navigation';

interface NavbarMobileProps {
    items: NavigationItem[];
    currentUrl: string;
    isSticky: boolean;
    menuOpen: boolean;
    setMenuOpen: (value: boolean) => void;
    openDropdown: string | null;
    setOpenDropdown: (value: string | null) => void;
    showLoginButton: boolean;
}

function MobileDropdown({
    items,
    isOpen,
    onClose,
    isSticky,
    currentUrl,
}: {
    items: NavigationChildItem[];
    isOpen: boolean;
    onClose: () => void;
    isSticky: boolean;
    currentUrl: string;
}) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div
            className={`mt-2 ml-6 space-y-1 overflow-hidden rounded-xl ${
                isSticky
                    ? 'bg-white/15 backdrop-blur-lg'
                    : 'bg-white/10 backdrop-blur-lg dark:bg-gray-800/10'
            }`}
        >
            {items.map((item) => {
                const Icon = item.icon;
                const isActive = currentUrl === item.href;

                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-x-3 p-3 transition-all duration-200 ${
                            isActive
                                ? 'bg-white/30 dark:bg-gray-800/30'
                                : 'hover:bg-white/20 dark:hover:bg-gray-800/20'
                        }`}
                    >
                        <div
                            className={`rounded-lg p-1.5 ${
                                isActive
                                    ? 'bg-white/40 dark:bg-gray-800/40'
                                    : 'bg-white/20 dark:bg-gray-800/20'
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

                        <div className="flex-1">
                            <p
                                className={`text-sm font-medium ${
                                    isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-800 dark:text-gray-200'
                                }`}
                            >
                                {t(item.nameKey)}
                            </p>
                            {item.descriptionKey && (
                                <p className="mt-0.5 text-xs opacity-75">
                                    {t(item.descriptionKey)}
                                </p>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

export default function NavbarMobile({
    items,
    currentUrl,
    isSticky,
    menuOpen,
    setMenuOpen,
    openDropdown,
    setOpenDropdown,
    showLoginButton,
}: NavbarMobileProps) {
    const { t } = useTranslation();

    if (!menuOpen) return null;

    return (
        <div
            className={`mt-4 w-full overflow-hidden rounded-2xl lg:hidden ${
                isSticky
                    ? 'bg-white/20 backdrop-blur-xl'
                    : 'bg-white/15 backdrop-blur-lg dark:bg-gray-800/15'
            }`}
        >
            <ul className="space-y-1 p-3">
                {items.map((item) => {
                    const isActive = isNavigationItemActive(item, currentUrl);

                    return (
                        <li
                            key={item.key}
                            className="border-b border-white/10 last:border-0 dark:border-gray-700/10"
                        >
                            <div className="space-y-1">
                                {item.dropdown ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenDropdown(
                                                    openDropdown === item.key
                                                        ? null
                                                        : item.key,
                                                )
                                            }
                                            className={`flex w-full items-center justify-between rounded-xl p-3 transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-white/30 dark:bg-gray-800/30'
                                                    : 'hover:bg-white/20 dark:hover:bg-gray-800/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-x-3">
                                                <div
                                                    className={`rounded-lg p-1.5 ${
                                                        isActive
                                                            ? 'bg-white/40 dark:bg-gray-800/40'
                                                            : 'bg-white/20 dark:bg-gray-800/20'
                                                    }`}
                                                >
                                                    <item.icon
                                                        className={`h-4 w-4 ${
                                                            isActive
                                                                ? 'text-blue-600 dark:text-blue-400'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <span
                                                    className={`font-medium ${
                                                        isActive
                                                            ? 'text-blue-600 dark:text-blue-400'
                                                            : 'text-gray-800 dark:text-gray-200'
                                                    }`}
                                                >
                                                    {t(item.nameKey)}
                                                </span>
                                            </div>
                                            <ChevronDownIcon
                                                className={`h-4 w-4 transition-transform duration-200 ${
                                                    openDropdown === item.key
                                                        ? 'rotate-180'
                                                        : ''
                                                }`}
                                            />
                                        </button>

                                        <MobileDropdown
                                            items={item.dropdown}
                                            isOpen={openDropdown === item.key}
                                            onClose={() => {
                                                setOpenDropdown(null);
                                                setMenuOpen(false);
                                            }}
                                            isSticky={isSticky}
                                            currentUrl={currentUrl}
                                        />
                                    </>
                                ) : (
                                    <Link
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        className={`flex items-center gap-x-3 rounded-xl p-3 transition-all duration-200 ${
                                            isActive
                                                ? 'bg-white/30 dark:bg-gray-800/30'
                                                : 'hover:bg-white/20 dark:hover:bg-gray-800/20'
                                        }`}
                                    >
                                        <div
                                            className={`rounded-lg p-1.5 ${
                                                isActive
                                                    ? 'bg-white/40 dark:bg-gray-800/40'
                                                    : 'bg-white/20 dark:bg-gray-800/20'
                                            }`}
                                        >
                                            <item.icon
                                                className={`h-4 w-4 ${
                                                    isActive
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                            />
                                        </div>
                                        <span
                                            className={`font-medium ${
                                                isActive
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-800 dark:text-gray-200'
                                            }`}
                                        >
                                            {t(item.nameKey)}
                                        </span>
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}

                {showLoginButton ? (
                    <li className="pt-2">
                        <Link
                            href="/login"
                            onClick={() => setMenuOpen(false)}
                            className="block rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Login
                        </Link>
                    </li>
                ) : null}
            </ul>
        </div>
    );
}

