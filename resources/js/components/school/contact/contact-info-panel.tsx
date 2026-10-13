import {
    ArrowTopRightOnSquareIcon,
    ChatBubbleLeftRightIcon,
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import ContactInfoCard from '@/components/school/contact/contact-info-card';
import type { SiteSettings } from '@/types';

interface ContactInfoPanelProps {
    contact: NonNullable<SiteSettings['contact']>;
    social: SiteSettings['social'];
}

// The "get in touch" column: quick call/email/WhatsApp actions, the info tiles,
// and any configured social profiles.
export default function ContactInfoPanel({ contact, social }: ContactInfoPanelProps) {
    const { t } = useTranslation();

    const phones = [contact.phone_primary, contact.phone_secondary].filter(
        (phone): phone is string => Boolean(phone),
    );
    const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
    const whatsappDigits = (social.whatsapp ?? '').replace(/[^\d]/g, '');

    const socialLinks = [
        { key: 'facebook', label: 'Facebook', url: social.facebook ?? undefined },
        { key: 'instagram', label: 'Instagram', url: social.instagram ?? undefined },
        { key: 'twitter', label: 'Twitter / X', url: social.twitter ?? undefined },
        { key: 'youtube', label: 'YouTube', url: social.youtube ?? undefined },
    ].filter((item) => Boolean(item.url));

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
                {phones[0] ? (
                    <a
                        href={telHref(phones[0])}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <PhoneIcon className="size-5" aria-hidden />
                        {t('contact.callUs')}
                    </a>
                ) : null}
                {contact.email ? (
                    <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <EnvelopeIcon className="size-5" aria-hidden />
                        {t('contact.emailUs')}
                    </a>
                ) : null}
            </div>

            {whatsappDigits ? (
                <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                >
                    <ChatBubbleLeftRightIcon className="size-6 shrink-0" aria-hidden />
                    <span className="text-sm font-semibold">
                        {t('contact.whatsappLabel')}
                    </span>
                </a>
            ) : null}

            {phones.map((phone, index) => (
                <ContactInfoCard
                    key={phone}
                    icon={<PhoneIcon className="size-5" aria-hidden />}
                    label={
                        index === 0
                            ? t('footer.phoneMain')
                            : t('footer.phoneSecondary')
                    }
                    value={phone}
                    href={telHref(phone)}
                    accent="bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                />
            ))}

            {contact.email ? (
                <ContactInfoCard
                    icon={<EnvelopeIcon className="size-5" aria-hidden />}
                    label={t('contact.emailLabel').replace(':', '')}
                    value={contact.email}
                    href={`mailto:${contact.email}`}
                    accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                />
            ) : null}

            {contact.address ? (
                <ContactInfoCard
                    icon={<MapPinIcon className="size-5" aria-hidden />}
                    label={t('contact.locationLabel').replace(':', '')}
                    value={contact.address}
                    accent="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                />
            ) : null}

            {socialLinks.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-900">
                    <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                        {t('contact.followUs')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {socialLinks.map((link) => (
                            <a
                                key={link.key}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-blue-950/40"
                            >
                                {link.label}
                                <ArrowTopRightOnSquareIcon
                                    className="size-3.5"
                                    aria-hidden
                                />
                            </a>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
