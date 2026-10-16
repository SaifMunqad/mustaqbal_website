import { isNavigationItemActive } from '@/components/general/header/navbar-utils';
import useReducedMotion from '@/hooks/use-reduced-motion';
import type { NavigationChildItem, NavigationItem } from '@/lib/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

/** Snappy, symmetric curve so neither open nor close feels sluggish. */
const MENU_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const PANEL_DURATION = 200;
const DROPDOWN_DURATION = 200;

interface NavbarMobileProps {
    items: NavigationItem[];
    currentUrl: string;
    isSticky: boolean;
    menuOpen: boolean;
    setMenuOpen: (value: boolean) => void;
    openDropdown: string | null;
    setOpenDropdown: (value: string | null) => void;
    isAuthenticated: boolean;
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
    const reducedMotion = useReducedMotion();

    // Height is driven by the grid 0fr -> 1fr trick so it animates smoothly
    // without measuring; styles stay inline to survive Tailwind purging.
    const wrapperStyle: CSSProperties = {
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        opacity: isOpen ? 1 : 0,
        transitionProperty: 'grid-template-rows, opacity',
        transitionDuration: reducedMotion ? '0ms' : `${DROPDOWN_DURATION}ms`,
        transitionTimingFunction: MENU_EASE,
    };

    return (
        <div style={wrapperStyle} aria-hidden={!isOpen}>
            <div className="overflow-hidden">
                <div
                    className={`ms-6 mt-2 space-y-1 rounded-xl ${
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
            </div>
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
    isAuthenticated,
}: NavbarMobileProps) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();

    // The panel stays mounted and collapses via the grid 0fr -> 1fr trick, so
    // open and close both animate continuously with no mount/unmount hitch.
    // Vertical translate only (RTL-safe); inline styles dodge Tailwind purging.
    const panelStyle: CSSProperties = {
        display: 'grid',
        gridTemplateRows: menuOpen ? '1fr' : '0fr',
        opacity: menuOpen ? 1 : 0,
        pointerEvents: menuOpen ? 'auto' : 'none',
        transform: menuOpen
            ? 'translate3d(0, 0, 0)'
            : 'translate3d(0, -8px, 0)',
        transitionProperty: 'grid-template-rows, opacity, transform',
        transitionDuration: reducedMotion ? '0ms' : `${PANEL_DURATION}ms`,
        transitionTimingFunction: MENU_EASE,
    };

    return (
        <div
            style={panelStyle}
            className="w-full lg:hidden"
            aria-hidden={!menuOpen}
        >
            <div className="min-h-0 overflow-hidden">
                {/*
                    Cap the card to the space left under the fixed bar so a tall
                    menu scrolls internally instead of overflowing the screen.
                    dvh keeps it correct as mobile browser chrome shows/hides.
                    Inline style survives Tailwind purging.
                */}
                <div
                    style={{ maxHeight: 'calc(100dvh - 5.5rem)' }}
                    className="mt-4 overflow-y-auto overscroll-contain rounded-2xl border border-gray-200/50 bg-white/95 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/95"
                >
                    <ul className="space-y-1 p-3">
                        {items.map((item) => {
                            const isActive = isNavigationItemActive(
                                item,
                                currentUrl,
                            );

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
                                                            openDropdown ===
                                                                item.key
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
                                                            openDropdown ===
                                                            item.key
                                                                ? 'rotate-180'
                                                                : ''
                                                        }`}
                                                    />
                                                </button>

                                                <MobileDropdown
                                                    items={item.dropdown}
                                                    isOpen={
                                                        openDropdown ===
                                                        item.key
                                                    }
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
                                                onClick={() =>
                                                    setMenuOpen(false)
                                                }
                                                className={`flex items-center gap-x-3 rounded-xl p-3 transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-white/30 dark:bg-gray-800/30'
                                                        : 'hover:bg-white/20 dark:hover:bg-gray-800/20'
                                                }`}
                                            >
                                                <div
                                                    className={`flex items-center gap-x-1 rounded-lg p-1.5 ${
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

                        <li className="pt-2">
                            <Link
                                href={isAuthenticated ? '/dashboard' : '/login'}
                                onClick={() => setMenuOpen(false)}
                                className="block rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                            >
                                {t(
                                    isAuthenticated
                                        ? 'navigation.dashboard'
                                        : 'navigation.login',
                                )}
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
