import { useTranslation } from 'react-i18next';

export default function FooterBottom() {
    const { t } = useTranslation();

    return (
        <div className="sm:flex sm:items-center sm:justify-between">
            <span className="text-sm text-gray-600 sm:text-center dark:text-gray-300">
                {`© ${new Date().getFullYear()} ${t('brand.name')}. ${t('footer.rights')}`}
            </span>
            <a
                href="mailto:info@mustaqbal.af"
                className="mt-3 block text-sm text-gray-600 hover:text-gray-900 hover:underline sm:mt-0 dark:text-gray-300 dark:hover:text-white"
            >
                info@mustaqbal.af
            </a>
        </div>
    );
}

