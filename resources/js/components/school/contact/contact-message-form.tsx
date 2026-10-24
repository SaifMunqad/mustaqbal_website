import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useForm } from '@inertiajs/react';
import { type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

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

function FieldLabel({
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
    return <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{message}</p>;
}

export default function ContactMessageForm({
    onSuccess,
    title,
    description,
}: {
    onSuccess: () => void;
    /** Authored heading from the builder block; falls back to the translated default. */
    title?: string;
    /** Optional intro paragraph shown above the required-fields note. */
    description?: string;
}) {
    const { t } = useTranslation();

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
                reset();
                onSuccess();
            },
        });
    }

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-slate-800 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {title || t('contact.formTitle')}
            </h2>
            {description ? (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {description}
                </p>
            ) : null}
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('contact.requiredNote')}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <FieldLabel htmlFor="name">{t('contact.fields.name')}</FieldLabel>
                        <input
                            id="name"
                            name="name"
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t('contact.namePlaceholder')}
                            className={inputClass(Boolean(errors.name))}
                            aria-invalid={Boolean(errors.name)}
                        />
                        <FieldError message={errors.name} />
                    </div>
                    <div>
                        <FieldLabel htmlFor="email">{t('contact.fields.email')}</FieldLabel>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t('contact.emailPlaceholder')}
                            className={inputClass(Boolean(errors.email))}
                            aria-invalid={Boolean(errors.email)}
                        />
                        <FieldError message={errors.email} />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <FieldLabel htmlFor="phone" optional>
                            {t('contact.fields.phone')}
                        </FieldLabel>
                        <input
                            id="phone"
                            name="phone"
                            autoComplete="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder={t('contact.phonePlaceholder')}
                            className={inputClass(Boolean(errors.phone))}
                        />
                        <FieldError message={errors.phone} />
                    </div>
                    <div>
                        <FieldLabel htmlFor="subject" optional>
                            {t('contact.fields.subject')}
                        </FieldLabel>
                        <input
                            id="subject"
                            name="subject"
                            value={data.subject}
                            onChange={(e) => setData('subject', e.target.value)}
                            placeholder={t('contact.subjectPlaceholder')}
                            className={inputClass(Boolean(errors.subject))}
                        />
                        <FieldError message={errors.subject} />
                    </div>
                </div>

                <div>
                    <FieldLabel htmlFor="message">{t('contact.fields.message')}</FieldLabel>
                    <textarea
                        id="message"
                        name="message"
                        rows={5}
                        value={data.message}
                        onChange={(e) => setData('message', e.target.value)}
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
    );
}
