/**
 * Brand lockup in the public navbar: uploaded logo when available, otherwise the
 * short brand name text. Always links back to the site root.
 */
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function NavbarBrand() {
    const { t } = useTranslation();
    const { site } = usePage<SharedData>().props;

    const shortName = site?.brand_short_name || t('brand.shortName');

    if (site?.logo_url) {
        return (
            <Link href="/" className="me-4 flex items-center">
                <img
                    src={site.logo_url}
                    alt={site.brand_name || shortName}
                    className="h-9 w-auto"
                />
            </Link>
        );
    }

    return (
        <Link
            href="/"
            className="me-4 block cursor-pointer py-1.5 text-lg font-bold tracking-tight text-slate-800 transition-all duration-300 dark:text-white"
        >
            <span className="bg-gradient-to-r from-brand to-purple-500 bg-clip-text text-transparent">
                {shortName}
            </span>
        </Link>
    );
}
