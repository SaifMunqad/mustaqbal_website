import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function FooterBrand() {
    const { t } = useTranslation();

    return (
        <div>
            <Link href="/" className="inline-flex items-center gap-x-3">
                <span className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-1 text-sm font-bold text-white">
                    M
                </span>
                <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('brand.name')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('brand.tagline')}
                    </p>
                </div>
            </Link>
        </div>
    );
}

