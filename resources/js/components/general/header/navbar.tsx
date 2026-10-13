import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/general/header/language-switcher';
import NavIconButton from '@/components/general/header/nav-icon-button';
import NavbarBrand from '@/components/general/header/navbar-brand';
import NavbarDesktop from '@/components/general/header/navbar-desktop';
import NavbarMobile from '@/components/general/header/navbar-mobile';
import { navTextButtonClass } from '@/components/general/header/navbar-styles';
import { navigationItems } from '@/lib/navigation';
import type { SharedData } from '@/types';

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
        <nav className="fixed top-0 inset-x-0 z-50 w-full rounded-none border-b border-gray-200/40 bg-white/90 px-3 py-1 shadow-sm backdrop-blur-md backdrop-saturate-150 transition-all duration-300 dark:border-gray-800/40 dark:bg-[#121212]/90">
            <div className="container mx-auto flex flex-wrap items-center justify-between">
                <NavbarBrand />

                <NavbarDesktop
                    items={navigationItems}
                    currentUrl={url}
                />

                <div className="ms-auto hidden lg:block">
                    <div className="flex items-center gap-2">
                        <NavIconButton href="/school/search" label={t('navigation.search')}>
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </NavIconButton>
                        {isGuest ? (
                            <Link
                                href="/login"
                                className={navTextButtonClass}
                            >
                                Login
                            </Link>
                        ) : null}
                        <LanguageSwitcher />
                    </div>
                </div>

                <div className="flex items-center gap-2 lg:hidden">
                    <NavIconButton href="/school/search" label={t('navigation.search')}>
                        <MagnifyingGlassIcon className="h-5 w-5" />
                    </NavIconButton>
                    <LanguageSwitcher />
                    <NavIconButton
                        label="Toggle mobile menu"
                        onClick={() => setMobileMenuOpen((value) => !value)}
                    >
                        <Bars3Icon className="h-5 w-5" />
                    </NavIconButton>
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
