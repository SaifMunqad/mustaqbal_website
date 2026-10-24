/**
 * One titled column of footer links.
 *
 * Each link may point at an internal path, an external URL or a contact detail
 * pulled from the site settings; `contactHref` builds the correct
 * `tel:` / `mailto:` / map-style target for the latter.
 */
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import SmartLink from '@/components/general/elements/smart-link';
import type { FooterSection } from '@/lib/navigation';
import type { SharedData } from '@/types';

interface FooterLinkSectionProps {
    section: FooterSection;
}

type ContactField = NonNullable<FooterSection['links'][number]['contact']>;

const FOOTER_LINK_CLASS = 'hover:text-gray-900 dark:hover:text-white';

// Build a usable href from a contact value pulled out of the shared settings.
function contactHref(field: ContactField, value: string): string {
    if (field === 'email') {
        return `mailto:${value}`;
    }
    // Strip formatting (spaces, dashes, parentheses) so the tel: link works.
    return `tel:${value.replace(/[^\d+]/g, '')}`;
}

export default function FooterLinkSection({ section }: FooterLinkSectionProps) {
    const { t } = useTranslation();
    const { site } = usePage<SharedData>().props;

    return (
        <div>
            <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                {t(section.titleKey)}
            </h2>
            <ul className="space-y-3 font-medium text-gray-600 dark:text-gray-300">
                {section.links.map((link) => {
                    // Contact-driven links read from the shared site settings so
                    // anything an admin edits in the dashboard is reflected here.
                    // When the value is empty the link is simply hidden.
                    if (link.contact) {
                        const value = site?.contact?.[link.contact];
                        if (!value) {
                            return null;
                        }

                        return (
                            <li key={link.key}>
                                <SmartLink href={contactHref(link.contact, value)} className={FOOTER_LINK_CLASS}>
                                    <span dir="ltr">{value}</span>
                                </SmartLink>
                            </li>
                        );
                    }

                    return (
                        <li key={link.key}>
                            <SmartLink href={link.href} className={FOOTER_LINK_CLASS}>
                                {t(link.labelKey)}
                            </SmartLink>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
