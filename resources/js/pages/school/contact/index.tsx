import ArticleBody from '@/components/editor/article-body';
import MainLayout from '@/layouts/app/main-layout';
import type { SiteSettings } from '@/types';
import {
    ArrowTopRightOnSquareIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ContactPageData {
    title: string;
    content?: { body?: string };
}

interface ContactForm {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}

// Shared input styling so every field looks identical and reads clearly in both
// light and dark mode. `invalid` switches to a red ring for per-field errors.
function inputClass(invalid?: boolean): string {
    return [
        'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition',
        'placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30',
        invalid
            ? 'border-red-400 focus:border-red-500 dark:border-red-500/60'
            : 'border-slate-300 focus:border-blue-500 dark:border-slate-700',
        'dark:bg-gray-900 dark:text-white',
    ].join(' ');
}

function Label({
    htmlFor,
    children,
    optional,
}: {
    htmlFor: string;
    children: ReactNode;
    optional?: boolean;
}) {
    const { t } = useTranslation();
    return (
        <label
            htmlFor={htmlFor}
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
            {children}
            {optional ? (
                <span className="ms-1 text-xs font-normal text-slate-400">
                    ({t('contact.optionalLabel')})
                </span>
            ) : (
                <span className="ms-1 text-red-500">*</span>
            )}
        </label>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }
    return (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {message}
        </p>
    );
}

/**
 * A single icon-led info tile in the "get in touch" column. Renders as an
 * anchor (click-to-call / click-to-email / WhatsApp) when `href` is provided,
 * or a static block otherwise.
 */
function InfoCard({
    icon,
    label,
    value,
    href,
    accent,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    href?: string;
    accent: string;
}) {
    const body = (
        <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-gray-900">
            <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accent}`}
            >
                {icon}
            </span>
            <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    {label}
                </p>
                <p
                    dir="auto"
                    className="mt-0.5 text-sm font-medium break-words text-slate-800 dark:text-slate-100"
                >
                    {value}
                </p>
            </div>
        </div>
    );

    if (!href) {
        return body;
    }

    return (
        <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="block"
        >
            {body}
        </a>
    );
}

function SchoolContact() {
    const { t } = useTranslation();
    const { page, site } = usePage<{
        page: ContactPageData | null;
        site: SiteSettings;
    }>().props;

    const title = page?.title ?? t('contact.title');
    const intro = page?.content?.body?.trim();

    const contact = site?.contact ?? {};
    const social = site?.social ?? {};

    const phones = [contact.phone_primary, contact.phone_secondary].filter(
        (p): p is string => Boolean(p),
    );
    const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
    const whatsappDigits = (social.whatsapp ?? '').replace(/[^\d]/g, '');

    const directionsUrl =
        contact.map_latitude != null && contact.map_longitude != null
            ? `https://www.google.com/maps/dir/?api=1&destination=${contact.map_latitude},${contact.map_longitude}`
            : contact.address
              ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}`
              : null;

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

    const [submitted, setSubmitted] = useState(false);

    const { data, setData, post, processing, errors, reset } =
        useForm<ContactForm>({
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: '',
        });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post('/community/contact', {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitted(true);
                reset();
            },
        });
    }

    if (submitted) {
        return (
            <>
                <Head title={title} />
                <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12 dark:border-slate-800 dark:bg-gray-900">
                    <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <CheckCircleIcon className="size-9" aria-hidden />
                    </span>
                    <h1 className="mt-5 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                        {t('contact.title')}
                    </h1>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                        {t('contact.successMessage')}
                    </p>
                    <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        {t('contact.sendAnother')}
                    </button>
                </section>
            </>
        );
    }

    return (
        <div className="space-y-6">
            <Head title={title} />

            {/* Page intro band, consistent with the redesigned home hero. */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-blue-50 p-6 shadow-sm md:p-10 dark:border-slate-800 dark:bg-blue-950">
                <h1 className="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
                    {title}
                </h1>
                {intro ? (
                    <div className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
                        <ArticleBody
                            body={intro}
                            className="text-slate-600 dark:text-slate-300"
                        />
                    </div>
                ) : (
                    <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-300">
                        {t('contact.paragraph')}
                    </p>
                )}
            </section>

            <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
                {/* Message form. */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-slate-800 dark:bg-gray-900">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {t('contact.formTitle')}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {t('contact.requiredNote')}
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="name">
                                    {t('contact.fields.name')}
                                </Label>
                                <input
                                    id="name"
                                    name="name"
                                    autoComplete="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder={t('contact.namePlaceholder')}
                                    className={inputClass(Boolean(errors.name))}
                                    aria-invalid={Boolean(errors.name)}
                                />
                                <FieldError message={errors.name} />
                            </div>
                            <div>
                                <Label htmlFor="email">
                                    {t('contact.fields.email')}
                                </Label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder={t('contact.emailPlaceholder')}
                                    className={inputClass(
                                        Boolean(errors.email),
                                    )}
                                    aria-invalid={Boolean(errors.email)}
                                />
                                <FieldError message={errors.email} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="phone" optional>
                                    {t('contact.fields.phone')}
                                </Label>
                                <input
                                    id="phone"
                                    name="phone"
                                    autoComplete="tel"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                    placeholder={t('contact.phonePlaceholder')}
                                    className={inputClass(
                                        Boolean(errors.phone),
                                    )}
                                />
                                <FieldError message={errors.phone} />
                            </div>
                            <div>
                                <Label htmlFor="subject" optional>
                                    {t('contact.fields.subject')}
                                </Label>
                                <input
                                    id="subject"
                                    name="subject"
                                    value={data.subject}
                                    onChange={(e) =>
                                        setData('subject', e.target.value)
                                    }
                                    placeholder={t(
                                        'contact.subjectPlaceholder',
                                    )}
                                    className={inputClass(
                                        Boolean(errors.subject),
                                    )}
                                />
                                <FieldError message={errors.subject} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="message">
                                {t('contact.fields.message')}
                            </Label>
                            <textarea
                                id="message"
                                name="message"
                                rows={5}
                                value={data.message}
                                onChange={(e) =>
                                    setData('message', e.target.value)
                                }
                                placeholder={t('contact.messagePlaceholder')}
                                className={`${inputClass(Boolean(errors.message))} resize-y`}
                                aria-invalid={Boolean(errors.message)}
                            />
                            <FieldError message={errors.message} />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                            {processing ? (
                                <svg
                                    className="size-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                            ) : (
                                <EnvelopeIcon className="size-4" aria-hidden />
                            )}
                            {t('contact.sendButton')}
                        </button>
                    </form>
                </section>

                {/* Contact information + quick actions. */}
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
                        <InfoCard
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
                        <InfoCard
                            icon={
                                <EnvelopeIcon className="size-5" aria-hidden />
                            }
                            label={t('contact.emailLabel').replace(':', '')}
                            value={contact.email}
                            href={`mailto:${contact.email}`}
                            accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                        />
                    ) : null}

                    {contact.address ? (
                        <InfoCard
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
            </div>

            {contact.map_embed_url ? (
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-gray-900">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {t('contact.visitingTitle')}
                            </h2>
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                {t('contact.visitingText')}
                            </p>
                        </div>
                        {directionsUrl ? (
                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-gray-800"
                            >
                                <MapPinIcon className="size-4" aria-hidden />
                                {t('contact.getDirections')}
                            </a>
                        ) : null}
                    </div>
                    <iframe
                        title={t('contact.mapTitle')}
                        src={contact.map_embed_url}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="h-80 w-full border-0"
                    />
                </section>
            ) : null}
        </div>
    );
}

SchoolContact.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolContact;
