/**
 * Public job advert card.
 *
 * Presents title, department, location, deadline and contract time, and expands
 * in place to reveal the description and application details instead of routing
 * away. Also used by the homepage "latest jobs" block and the dashboard preview,
 * so all three stay identical.
 */
import {
    AcademicCapIcon,
    BriefcaseIcon,
    CalendarDaysIcon,
    ClockIcon,
    EnvelopeIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface Job {
    id: number;
    title: string;
    slug: string;
    department?: string | null;
    category?: string | null;
    category_label?: string | null;
    description: string;
    requirements?: string | null;
    employment_type: string;
    working_hours?: string | null;
    application_email?: string | null;
    application_url?: string | null;
    deadline?: string | null;
    created_at: string;
}

const categoryStyles: Record<
    string,
    { label: string; classes: string; Icon: typeof AcademicCapIcon }
> = {
    school: {
        label: 'School',
        classes:
            'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
        Icon: AcademicCapIcon,
    },
    course: {
        label: 'Course',
        classes:
            'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        Icon: BriefcaseIcon,
    },
    islamic_madrasa: {
        label: 'Islamic Madrasa',
        classes:
            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        Icon: AcademicCapIcon,
    },
};

/**
 * Shared job posting card. Used by the public jobs listing and the home-page
 * "latest jobs" block so both read identically. Email reveal is local state, so
 * each card toggles independently.
 */
export default function JobCard({ job }: { job: Job }) {
    const { t } = useTranslation();
    const [showEmail, setShowEmail] = useState(false);
    const categoryMeta = job.category ? categoryStyles[job.category] : null;

    return (
        <article className="rounded-2xl border border-brand-border/60 bg-brand-soft p-6 shadow-sm transition hover:shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {job.title}
                    </h2>
                    {job.department || categoryMeta ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {job.department ? (
                                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                    <MapPinIcon className="size-4" />
                                    {job.department}
                                </span>
                            ) : null}
                            {categoryMeta ? (
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryMeta.classes}`}
                                >
                                    <categoryMeta.Icon className="size-3.5" />
                                    {t(
                                        `jobs.category.${job.category ?? ''}`,
                                        categoryMeta.label,
                                    )}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-ink dark:bg-brand-deep/40">
                    <BriefcaseIcon className="size-3.5" />
                    {t(
                        `jobs.employmentType.${job.employment_type}`,
                        job.employment_type,
                    )}
                </span>
            </div>

            {job.employment_type === 'part_time' && job.working_hours ? (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200">
                    <ClockIcon className="size-4" />
                    <span className="font-medium">{t('jobs.hours')}:</span>
                    <span>{job.working_hours}</span>
                </div>
            ) : null}

            <div className="prose prose-sm dark:prose-invert mt-4 max-w-none">
                <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">
                    {job.description}
                </p>
            </div>

            {job.requirements ? (
                <div className="mt-3 rounded-xl bg-brand-soft p-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {t('jobs.requirements')}
                    </h3>
                    <p className="mt-1 text-sm whitespace-pre-line text-gray-600 dark:text-gray-400">
                        {job.requirements}
                    </p>
                </div>
            ) : null}

            {job.application_email || job.application_url || job.deadline ? (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {job.application_email ? (
                            showEmail ? (
                                <a
                                    href={`mailto:${job.application_email}`}
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition hover:bg-brand-hover"
                                >
                                    <EnvelopeIcon className="size-4" />
                                    {job.application_email}
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowEmail(true)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-soft px-4 py-2 text-sm font-medium text-brand-ink transition hover:bg-brand-soft-strong dark:bg-brand-deep/30 dark:hover:bg-brand-deep/50"
                                >
                                    <EnvelopeIcon className="size-4" />
                                    {t('jobs.showEmail')}
                                </button>
                            )
                        ) : null}

                        {job.application_url ? (
                            <a
                                href={job.application_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                            >
                                {t('jobs.applyOnline')}
                            </a>
                        ) : null}
                    </div>

                    {job.deadline ? (
                        <span className="ms-auto inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <CalendarDaysIcon className="size-4" />
                            <span>
                                {t('jobs.deadline')}: {job.deadline}
                            </span>
                        </span>
                    ) : null}
                </div>
            ) : null}
        </article>
    );
}
