import { Bars3Icon } from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import LanguageSwitcher from '@/components/general/header/language-switcher';
import NavbarBrand from '@/components/general/header/navbar-brand';
import NavbarDesktop from '@/components/general/header/navbar-desktop';
import NavbarMobile from '@/components/general/header/navbar-mobile';
import { navigationItems } from '@/lib/navigation';

export default function Navbar() {
    const page = usePage<{ auth?: { user?: unknown } }>();
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
            className={`sticky top-0 z-50 mx-auto block w-full rounded-2xl px-4 py-2 shadow-lg transition-all duration-500 lg:px-8 lg:py-3 ${
                isSticky
                    ? 'top-3 border border-white/30 bg-white/20 shadow-xl backdrop-blur-xl backdrop-saturate-200 dark:border-gray-800/50 dark:bg-gray-900/30'
                    : 'border border-gray-200/30 bg-white/15 backdrop-blur-lg backdrop-saturate-150 dark:border-gray-800/30 dark:bg-[#181818]/90'
            }`}
        >
            <div className="container mx-auto flex flex-wrap items-center justify-between">
                <NavbarBrand isSticky={isSticky} />

                <NavbarDesktop
                    items={navigationItems}
                    currentUrl={url}
                    isSticky={isSticky}
                />

                <div className="ml-auto hidden lg:block">
                    <div className="flex items-center gap-2">
                        {isGuest ? (
                            <Link
                                href="/login"
                                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-300 ${
                                    isSticky
                                        ? 'border-white/30 bg-white/20 text-white hover:bg-white/30'
                                        : 'border-gray-200/40 bg-white/20 text-slate-700 hover:bg-white/30 dark:border-gray-700/40 dark:bg-gray-800/20 dark:text-slate-200 dark:hover:bg-gray-800/30'
                                }`}
                            >
                                Login
                            </Link>
                        ) : null}
                        <LanguageSwitcher isSticky={isSticky} />
                    </div>
                </div>

                <button
                    onClick={() => setMobileMenuOpen((value) => !value)}
                    className={`relative ml-2 h-8 w-8 rounded-xl text-center align-middle transition-all duration-300 lg:hidden ${
                        isSticky
                            ? 'bg-white/20 text-white hover:bg-white/30'
                            : 'bg-white/20 text-slate-700 hover:bg-white/30 dark:bg-gray-800/20 dark:text-slate-300 dark:hover:bg-gray-800/30'
                    }`}
                    type="button"
                >
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                        <Bars3Icon className="h-5 w-5" />
                    </span>
                </button>

                <div className="mt-4 w-full lg:hidden">
                    <LanguageSwitcher isSticky={isSticky} className="w-fit" />
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
