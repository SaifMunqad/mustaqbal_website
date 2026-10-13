import { ReactNode, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/layouts/app/main-layout';
import {
    AcademicCapIcon,
    BriefcaseIcon,
    CalendarDaysIcon,
    ClockIcon,
    EnvelopeIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';

interface Job {
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

interface Props {
    jobs: Job[];
    [key: string]: unknown;
}

const employmentTypeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
};

const categoryStyles: Record<string, { label: string; classes: string; Icon: typeof AcademicCapIcon }> = {
    school: {
        label: 'School',
        classes: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
        Icon: AcademicCapIcon,
    },
    course: {
        label: 'Course',
        classes: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        Icon: BriefcaseIcon,
    },
    islamic_madrasa: {
        label: 'Islamic Madrasa',
        classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        Icon: AcademicCapIcon,
    },
};

function JobCard({ job }: { job: Job }) {
    const [showEmail, setShowEmail] = useState(false);
    const categoryMeta = job.category ? categoryStyles[job.category] : null;

    return (
        <article className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700/60 dark:bg-gray-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {job.title}
                    </h2>
                    {(job.department || categoryMeta) ? (
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
                                    {categoryMeta.label}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    <BriefcaseIcon className="size-3.5" />
                    {employmentTypeLabels[job.employment_type] ?? job.employment_type}
                </span>
            </div>

            {job.employment_type === 'part_time' && job.working_hours ? (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                    <ClockIcon className="size-4" />
                    <span className="font-medium">Hours:</span>
                    <span>{job.working_hours}</span>
                </div>
            ) : null}

            <div className="mt-4 prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                    {job.description}
                </p>
            </div>

            {job.requirements ? (
                <div className="mt-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Requirements
                    </h3>
                    <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
                        {job.requirements}
                    </p>
                </div>
            ) : null}

            {(job.application_email || job.application_url) ? (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {job.application_email ? (
                        showEmail ? (
                            <a
                                href={`mailto:${job.application_email}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                            >
                                <EnvelopeIcon className="size-4" />
                                {job.application_email}
                            </a>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowEmail(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50"
                            >
                                <EnvelopeIcon className="size-4" />
                                Show Email
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
                            Apply Online
                        </a>
                    ) : null}
                </div>
            ) : null}

            {job.deadline ? (
                <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <CalendarDaysIcon className="size-4" />
                    <span>Deadline: {job.deadline}</span>
                </div>
            ) : null}
        </article>
    );
}

function JobsPage() {
    const { jobs } = usePage<Props>().props;
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('navigation.jobs')} />
            <section className="space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {t('navigation.jobs')}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {t('navigationDescriptions.jobs')}
                    </p>
                </div>

                {jobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        No open positions at the moment. Check back soon!
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-2">
                        {jobs.map((job) => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}

JobsPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default JobsPage;
