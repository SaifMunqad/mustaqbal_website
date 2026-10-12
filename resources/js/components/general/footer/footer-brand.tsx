import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import type { SharedData } from '@/types';

export default function FooterBrand() {
    const { t } = useTranslation();
    const { site } = usePage<SharedData>().props;

    const name = site?.brand_name || t('brand.name');
    const tagline = site?.tagline || t('brand.tagline');
    const initials = (site?.brand_short_name || name).charAt(0).toUpperCase();

    return (
        <div>
            <Link href="/" className="inline-flex items-center gap-x-3">
                {site?.logo_url ? (
                    <img src={site.logo_url} alt={name} className="h-10 w-auto" />
                ) : (
                    <span className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-1 text-sm font-bold text-white">
                        {initials}
                    </span>
                )}
                <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {tagline}
                    </p>
                </div>
            </Link>
        </div>
    );
}
