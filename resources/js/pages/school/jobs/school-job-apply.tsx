/**
 * Public job application page.
 *
 * Shows the open position's details alongside the application form, so a
 * candidate never has to leave the advert to apply. Reached from the "Apply"
 * button on the shared job card.
 */
import JobApplicationForm from '@/components/school/job-application-form';
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import { Head, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Job } from '@/components/school/job-card';

interface SchoolJobApplyProps {
    job: Job;
    [key: string]: unknown;
}

function SchoolJobApply() {
    const { job } = usePage<SchoolJobApplyProps>().props;
    const { t } = useTranslation();

    return (
        <>
            <Head title={`${t('jobs.apply.title')} — ${job.title}`} />
            <section className="mx-auto max-w-3xl space-y-6">
                <Reveal direction="fade" defaultInView>
                    <article className="rounded-2xl border border-brand-border/60 bg-brand-soft p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink dark:text-brand-fg">
                            {t('jobs.apply.title')}
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {job.title}
                        </h1>
                        {job.department ? (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {job.department}
                            </p>
                        ) : null}
                        <div className="prose prose-sm dark:prose-invert mt-4 max-w-none">
                            <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">
                                {job.description}
                            </p>
                        </div>
                        {job.requirements ? (
                            <div className="mt-3 rounded-xl bg-white/60 p-4 dark:bg-gray-900/40">
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {t('jobs.requirements')}
                                </h2>
                                <p className="mt-1 text-sm whitespace-pre-line text-gray-600 dark:text-gray-400">
                                    {job.requirements}
                                </p>
                            </div>
                        ) : null}
                        {job.deadline ? (
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                {t('jobs.deadline')}: {job.deadline}
                            </p>
                        ) : null}
                    </article>
                </Reveal>

                <Reveal direction="fade">
                    <JobApplicationForm jobSlug={job.slug} jobTitle={job.title} />
                </Reveal>
            </section>
        </>
    );
}

SchoolJobApply.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolJobApply;
