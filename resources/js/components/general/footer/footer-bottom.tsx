/**
 * Bottom strip of the public footer: copyright line plus social links.
 *
 * Only channels with a configured URL are rendered; the WhatsApp entry is
 * converted to a `wa.me` deep link with non-digits stripped. The year is taken
 * from the client clock, matching the rest of the site's date handling.
 */
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import type { SharedData } from '@/types';

export default function FooterBottom() {
    const { t } = useTranslation();
    const { site } = usePage<SharedData>().props;

    const name = site?.brand_name || t('brand.name');
    const rights = site?.footer_text || t('footer.rights');

    const social = site?.social ?? {};
    const socialLinks = [
        { key: 'facebook', href: social.facebook, label: 'Facebook' },
        { key: 'instagram', href: social.instagram, label: 'Instagram' },
        { key: 'twitter', href: social.twitter, label: 'Twitter' },
        { key: 'youtube', href: social.youtube, label: 'YouTube' },
        {
            key: 'whatsapp',
            href: social.whatsapp ? `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, '')}` : null,
            label: 'WhatsApp',
        },
    ].filter((link) => Boolean(link.href));

    return (
        <div className="sm:flex sm:items-center sm:justify-between">
            <span className="text-sm text-gray-600 sm:text-center dark:text-gray-300">
                {`© ${new Date().getFullYear()} ${name}. ${rights}`}
            </span>

            <div className="mt-3 flex flex-wrap items-center gap-4 sm:mt-0">
                {socialLinks.map((link) => (
                    <a
                        key={link.key}
                        href={link.href as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-white"
                    >
                        {link.label}
                    </a>
                ))}
            </div>
        </div>
    );
}
