import { Bars3Icon } from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import LanguageSwitcher from '@/components/general/header/language-switcher';
import NavbarBrand from '@/components/general/header/navbar-brand';
import NavbarDesktop from '@/components/general/header/navbar-desktop';
import NavbarMobile from '@/components/general/header/navbar-mobile';
import { navigationItems } from '@/lib/navigation';
import type { SharedData } from '@/types';

export default function Navbar() {
    const page = usePage<SharedData>();
    const { url, props } = page;
    const { auth } = props;
    const isGuest = !auth?.user;
    const [isSticky, setIsSticky] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(
        null,
    );

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setMobileMenuOpen(false);
            setOpenMobileDropdown(null);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [url]);

    return (
        <nav
            className={`fixed top-0 inset-x-0 z-50 transition-all shadow-sm duration-300 py-1 px-3 ${
                isSticky
                    ? 'w-full rounded-none border-b border-gray-200/40 bg-white/90 backdrop-blur-md backdrop-saturate-150  dark:border-gray-800/40 dark:bg-[#121212]/90'
                    // ? 'rounded-2xl border border-gray-200/50 bg-white/80 backdrop-blur-xl backdrop-saturate-200 dark:border-gray-800/50 dark:bg-gray-900/80'
                    : 'w-full rounded-none border-b border-gray-200/40 bg-white/90 backdrop-blur-md backdrop-saturate-150  dark:border-gray-800/40 dark:bg-[#121212]/90'
            }`}
        >
            <div className="container mx-auto flex flex-wrap items-center justify-between">
                <NavbarBrand isSticky={isSticky} />

                <NavbarDesktop
                    items={navigationItems}
                    currentUrl={url}
                    isSticky={isSticky}
                />

                <div className="ms-auto hidden lg:block">
                    <div className="flex items-center gap-2">
                        {isGuest ? (
                            <Link
                                href="/login"
                                className="rounded-xl border border-gray-200/40 bg-white/20 px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:bg-white/40 dark:border-gray-700/40 dark:bg-gray-800/20 dark:text-slate-200 dark:hover:bg-gray-800/40"
                            >
                                Login
                            </Link>
                        ) : null}
                        <LanguageSwitcher isSticky={isSticky} />
                    </div>
                </div>

                <div className="flex items-center gap-2 lg:hidden">
                    <LanguageSwitcher isSticky={isSticky} />
                    <button
                        onClick={() => setMobileMenuOpen((value) => !value)}
                        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/40 bg-white/20 text-slate-700 transition-all duration-300 hover:bg-white/40 dark:border-gray-700/40 dark:bg-gray-800/20 dark:text-slate-200 dark:hover:bg-gray-800/40"
                        type="button"
                        aria-label="Toggle mobile menu"
                    >
                        <Bars3Icon className="h-5 w-5" />
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
                    showLoginButton={isGuest}
                />
            </div>
        </nav>
    );
}
