import ContactInfoCard from '@/components/school/contact/contact-info-card';
import type { SiteSettings } from '@/types';
import {
    ArrowTopRightOnSquareIcon,
    ChatBubbleLeftRightIcon,
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface ContactInfoPanelProps {
    contact: NonNullable<SiteSettings['contact']>;
    social: SiteSettings['social'];
}

// The "get in touch" column: quick call/email/WhatsApp actions, the info tiles,
// and any configured social profiles.
export default function ContactInfoPanel({
    contact,
    social,
}: ContactInfoPanelProps) {
    const { t } = useTranslation();

    const phones = [contact.phone_primary, contact.phone_secondary].filter(
        (phone): phone is string => Boolean(phone),
    );
    const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
    const whatsappDigits = (social.whatsapp ?? '').replace(/[^\d]/g, '');

    const socialLinks = [
        {
            key: 'facebook',
            label: 'Facebook',
            url: social.facebook ?? undefined,
        },
        {
            key: 'instagram',
            label: 'Instagram',
            url: social.instagram ?? undefined,
        },
        {
            key: 'twitter',
            label: 'Twitter / X',
            url: social.twitter ?? undefined,
        },
        { key: 'youtube', label: 'YouTube', url: social.youtube ?? undefined },
    ].filter((item) => Boolean(item.url));

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
                {phones[0] ? (
                    <a
                        href={telHref(phones[0])}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-brand-fg shadow-sm transition hover:bg-brand-hover"
                    >
                        <PhoneIcon className="size-5" aria-hidden />
                        {t('contact.callUs')}
                    </a>
                ) : null}
                {contact.email ? (
                    <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-brand-fg shadow-sm transition hover:bg-brand-hover"
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
                    className="flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-soft p-4 text-brand-ink transition hover:bg-brand-soft-strong dark:bg-brand-deep/40"
                >
                    <ChatBubbleLeftRightIcon
                        className="size-6 shrink-0"
                        aria-hidden
                    />
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
                    accent="bg-brand-soft-strong text-brand-ink dark:bg-brand/15"
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
                <div className="rounded-2xl border border-brand-border bg-brand-soft p-4 shadow-sm">
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
                                className="inline-flex items-center gap-1.5 rounded-full border border-brand-border px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand hover:bg-brand-soft dark:text-slate-200 dark:hover:bg-brand-deep/40"
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
