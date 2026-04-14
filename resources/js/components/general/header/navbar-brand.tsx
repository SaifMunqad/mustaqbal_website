import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface NavbarBrandProps {
    isSticky: boolean;
}

export default function NavbarBrand({ isSticky }: NavbarBrandProps) {
    const { t } = useTranslation();

    return (
        <Link
            href="/"
            className={`mr-4 block cursor-pointer py-1.5 text-lg font-bold tracking-tight transition-all duration-500 ${
                isSticky
                    ? 'text-white drop-shadow-lg'
                    : 'text-slate-800 dark:text-white'
            }`}
        >
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {t('brand.shortName')}
            </span>
        </Link>
    );
}

