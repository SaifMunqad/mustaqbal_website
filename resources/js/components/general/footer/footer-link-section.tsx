import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import type { FooterSection } from '@/lib/navigation';

interface FooterLinkSectionProps {
    section: FooterSection;
}

export default function FooterLinkSection({ section }: FooterLinkSectionProps) {
    const { t } = useTranslation();

    return (
        <div>
            <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                {t(section.titleKey)}
            </h2>
            <ul className="space-y-3 font-medium text-gray-600 dark:text-gray-300">
                {section.links.map((link) => {
                    const isExternal =
                        link.href.startsWith('http') ||
                        link.href.startsWith('mailto:') ||
                        link.href.startsWith('tel:');

                    return (
                        <li key={link.key}>
                            {isExternal ? (
                                <a
                                    href={link.href}
                                    className="hover:text-gray-900 hover:underline dark:hover:text-white"
                                >
                                    {t(link.labelKey)}
                                </a>
                            ) : (
                                <Link
                                    href={link.href}
                                    className="hover:text-gray-900 hover:underline dark:hover:text-white"
                                >
                                    {t(link.labelKey)}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

