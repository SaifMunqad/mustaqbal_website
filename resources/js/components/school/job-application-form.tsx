/**
 * Public job application form.
 *
 * Collects a candidate's personal details, related job experience and an
 * unlimited (capped at MAX_DOCUMENTS, 3 MB each) set of supporting documents.
 * Submits through Inertia's `useForm` as multipart; every field carries its own
 * inline validation error, and files are pre-checked client-side for the 3 MB
 * limit before the request is ever sent.
 */
import { DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useForm } from '@inertiajs/react';
import { type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
export const MAX_DOCUMENTS = 15;

interface JobApplicationForm {
    first_name: string;
    last_name: string;
    father_name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    experience: string;
    cover_letter: string;
    documents: File[];
}

function inputClass(invalid?: boolean): string {
    return [
        'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition',
        'placeholder:text-slate-400 focus:ring-2 focus:ring-brand/30',
        invalid
            ? 'border-red-400 focus:border-red-500 dark:border-red-500/60'
            : 'border-brand-border focus:border-brand',
        'dark:bg-gray-900 dark:text-white',
    ].join(' ');
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function JobApplicationForm({
    jobSlug,
    jobTitle,
}: {
    jobSlug: string;
    jobTitle: string;
}) {
    const { t } = useTranslation();
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm<JobApplicationForm>({
        first_name: '',
        last_name: '',
        father_name: '',
        email: '',
        phone: '',
        city: '',
        address: '',
        experience: '',
        cover_letter: '',
        documents: [],
    });

    function handleFilePick(event: ChangeEvent<HTMLInputElement>) {
        const picked = Array.from(event.target.files ?? []);
        event.target.value = '';

        const withinSizeLimit = picked.filter(
            (file) => file.size <= MAX_DOCUMENT_BYTES,
        );
        const remainingSlots = Math.max(
            0,
            MAX_DOCUMENTS - data.documents.length,
        );

        setData(
            'documents',
            data.documents.concat(withinSizeLimit.slice(0, remainingSlots)),
        );
    }

    function removeDocument(index: number) {
        setData(
            'documents',
            data.documents.filter((_, i) => i !== index),
        );
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post(`/school/jobs/${jobSlug}/apply`, {
            forceFormData: true,
            onSuccess: () => setData('documents', []),
        });
    }

    return (
        <section className="rounded-3xl border border-brand-border bg-brand-soft p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('jobs.apply.formTitle', { job: jobTitle })}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('jobs.apply.requiredNote')}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {t('jobs.apply.personalInfo')}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="first_name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('jobs.apply.fields.firstName')}
                                <span className="ms-1 text-red-500">*</span>
                            </label>
                            <input
                                id="first_name"
                                value={data.first_name}
                                onChange={(e) => setData('first_name', e.target.value)}
                                className={inputClass(Boolean(errors.first_name))}
                                aria-invalid={Boolean(errors.first_name)}
                            />
                            {errors.first_name ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.first_name}</p> : null}
                        </div>
                        <div>
                            <label htmlFor="last_name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('jobs.apply.fields.lastName')}
                                <span className="ms-1 text-red-500">*</span>
                            </label>
                            <input
                                id="last_name"
                                value={data.last_name}
                                onChange={(e) => setData('last_name', e.target.value)}
                                className={inputClass(Boolean(errors.last_name))}
                                aria-invalid={Boolean(errors.last_name)}
                            />
                            {errors.last_name ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.last_name}</p> : null}
                        </div>
                        <div>
                            <label htmlFor="father_name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('jobs.apply.fields.fatherName')}
                                <span className="ms-1 text-red-500">*</span>
                            </label>
                            <input
                                id="father_name"
                                value={data.father_name}
                                onChange={(e) => setData('father_name', e.target.value)}
                                className={inputClass(Boolean(errors.father_name))}
                                aria-invalid={Boolean(errors.father_name)}
                            />
                            {errors.father_name ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.father_name}</p> : null}
                        </div>
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('jobs.apply.fields.email')}
                                <span className="ms-1 text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className={inputClass(Boolean(errors.email))}
                                aria-invalid={Boolean(errors.email)}
                            />
                            {errors.email ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email}</p> : null}
                        </div>
                        <div>
                            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('jobs.apply.fields.phone')}
                                <span className="ms-1 text-red-500">*</span>
                            </label>
                            <input
                                id="phone"
                                autoComplete="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className={inputClass(Boolean(errors.phone))}
                                aria-invalid={Boolean(errors.phone)}
                            />
                            {errors.phone ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.phone}</p> : null}
                        </div>
                        <div>
                            <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('jobs.apply.fields.city')}
                            </label>
                            <input
                                id="city"
                                value={data.city}
                                onChange={(e) => setData('city', e.target.value)}
                                className={inputClass(Boolean(errors.city))}
                            />
                            {errors.city ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.city}</p> : null}
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('jobs.apply.fields.address')}
                            </label>
                            <textarea
                                id="address"
                                rows={2}
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className={`${inputClass(Boolean(errors.address))} resize-y`}
                            />
                            {errors.address ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.address}</p> : null}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {t('jobs.apply.experienceInfo')}
                    </h3>
                    <div>
                        <label htmlFor="experience" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            {t('jobs.apply.fields.experience')}
                            <span className="ms-1 text-red-500">*</span>
                        </label>
                        <textarea
                            id="experience"
                            rows={4}
                            value={data.experience}
                            onChange={(e) => setData('experience', e.target.value)}
                            placeholder={t('jobs.apply.experiencePlaceholder')}
                            className={`${inputClass(Boolean(errors.experience))} resize-y`}
                            aria-invalid={Boolean(errors.experience)}
                        />
                        {errors.experience ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.experience}</p> : null}
                    </div>
                    <div>
                        <label htmlFor="cover_letter" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            {t('jobs.apply.fields.coverLetter')}
                        </label>
                        <textarea
                            id="cover_letter"
                            rows={4}
                            value={data.cover_letter}
                            onChange={(e) => setData('cover_letter', e.target.value)}
                            className={`${inputClass(Boolean(errors.cover_letter))} resize-y`}
                        />
                        {errors.cover_letter ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.cover_letter}</p> : null}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {t('jobs.apply.documentsInfo')}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('jobs.apply.documentsHint', {
                            max: formatBytes(MAX_DOCUMENT_BYTES),
                        })}
                    </p>
                    {errors.documents ? <p className="text-sm text-red-600 dark:text-red-400">{String(errors.documents)}</p> : null}

                    <input
                        id="documents"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFilePick}
                        className="block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-fg hover:file:bg-brand-hover dark:text-slate-300"
                    />

                    {data.documents.length > 0 ? (
                        <ul className="space-y-2">
                            {data.documents.map((file, index) => (
                                <li
                                    key={`${file.name}-${index}`}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm dark:bg-gray-900"
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <DocumentTextIcon className="size-4 shrink-0 text-brand-ink dark:text-brand-fg" />
                                        <span className="truncate text-slate-700 dark:text-slate-200">{file.name}</span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-3">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeDocument(index)}
                                            aria-label={t('jobs.apply.removeDocument')}
                                            className="rounded-lg p-1 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                        >
                                            <TrashIcon className="size-4" />
                                        </button>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-400">{t('jobs.apply.noDocumentsYet')}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-fg shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                    {processing ? t('jobs.apply.submitting') : t('jobs.apply.submit')}
                </button>
            </form>
        </section>
    );
}
