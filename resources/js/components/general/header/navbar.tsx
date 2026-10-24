import LanguageSwitcher from '@/components/general/header/language-switcher';
import NavIconButton from '@/components/general/header/nav-icon-button';
import NavbarBrand from '@/components/general/header/navbar-brand';
import NavbarDesktop from '@/components/general/header/navbar-desktop';
import NavbarMobile from '@/components/general/header/navbar-mobile';
import { navTextButtonClass } from '@/components/general/header/navbar-styles';
import { navigationItems } from '@/lib/navigation';
import type { SharedData } from '@/types';
import {
    Bars3Icon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Snappy, symmetric curve so neither the open nor close feels sluggish. */
const MENU_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

export default function Navbar() {
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { url, props } = page;
    const { auth } = props;
    const isGuest = !auth?.user;
    const [isSticky, setIsSticky] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(
        null,
    );
    // The nav wraps both the mobile toggle button and the panel, so using it
    // as the click-outside container avoids the race where tapping the toggle
    // reads as an outside click (close) and then re-opens on its own click.
    const navRef = useRef<HTMLElement>(null);

    const closeMobileMenu = useCallback(() => {
        setMobileMenuOpen(false);
        setOpenMobileDropdown(null);
    }, []);

    const toggleMobileMenu = useCallback(() => {
        setMobileMenuOpen((open) => !open);
    }, []);

    // Dismiss the open mobile nav when the user taps/clicks anywhere outside it.
    useEffect(() => {
        if (!mobileMenuOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            const nav = navRef.current;
            if (nav && !nav.contains(event.target as Node)) {
                closeMobileMenu();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () =>
            document.removeEventListener('pointerdown', handlePointerDown);
    }, [mobileMenuOpen, closeMobileMenu]);

    // While the menu is open, freeze the page behind it. The panel can grow
    // taller than the viewport, so it scrolls internally instead of pushing
    // the whole document. Restores the prior overflow on close/unmount.
    useEffect(() => {
        if (!mobileMenuOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            closeMobileMenu();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [url, closeMobileMenu]);

    return (
        <nav
            ref={navRef}
            className="fixed inset-x-0 top-0 z-50 w-full rounded-none border-b border-brand-border/40 bg-white/90 px-3 py-1 shadow-sm backdrop-blur-md backdrop-saturate-150 transition-all duration-300 dark:bg-[#121212]/90"
        >
            <div className="container mx-auto flex flex-wrap items-center justify-between">
                <NavbarBrand />

                <NavbarDesktop items={navigationItems} currentUrl={url} />

                <div className="ms-auto hidden lg:block">
                    <div className="flex items-center gap-2">
                        <NavIconButton
                            href="/school/search"
                            label={t('navigation.search')}
                        >
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </NavIconButton>
                        {isGuest ? (
                            <Link href="/login" className={navTextButtonClass}>
                                {t('navigation.login')}
                            </Link>
                        ) : (
                            <Link
                                href="/dashboard"
                                className={navTextButtonClass}
                            >
                                {t('navigation.dashboard')}
                            </Link>
                        )}
                        <LanguageSwitcher />
                    </div>
                </div>

                <div className="flex items-center gap-2 lg:hidden">
                    <NavIconButton
                        href="/school/search"
                        label={t('navigation.search')}
                    >
                        <MagnifyingGlassIcon className="h-5 w-5" />
                    </NavIconButton>
                    <LanguageSwitcher />
                    <button
                        type="button"
                        aria-label={t('navigation.toggleMenu')}
                        aria-expanded={mobileMenuOpen}
                        onClick={toggleMobileMenu}
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-gray-700 transition-colors duration-200 hover:bg-brand-soft hover:text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-brand-ink"
                    >
                        <Bars3Icon
                            aria-hidden="true"
                            className="absolute h-5 w-5 transition-all duration-300 ease-out"
                            style={{
                                opacity: mobileMenuOpen ? 0 : 1,
                                transform: mobileMenuOpen
                                    ? 'rotate(-90deg) scale(0.6)'
                                    : 'rotate-0 scale-1',
                                transitionTimingFunction: MENU_EASE,
                            }}
                        />
                        <XMarkIcon
                            aria-hidden="true"
                            className="absolute h-5 w-5 transition-all duration-300 ease-out"
                            style={{
                                opacity: mobileMenuOpen ? 1 : 0,
                                transform: mobileMenuOpen
                                    ? 'rotate-0 scale-1'
                                    : 'rotate(90deg) scale(0.6)',
                                transitionTimingFunction: MENU_EASE,
                            }}
                        />
                    </button>
                </div>

                <NavbarMobile
                    items={navigationItems}
                    currentUrl={url}
                    isSticky={isSticky}
                    menuOpen={mobileMenuOpen}
                    setMenuOpen={setMobileMenuOpen}
                    openDropdown={openMobileDropdown}
                    setOpenDropdown={setOpenMobileDropdown}
                    isAuthenticated={!isGuest}
                />
            </div>
        </nav>
    );
}
