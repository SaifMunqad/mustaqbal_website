import JobCard, { type Job } from '@/components/school/job-card';
import Reveal from '@/components/ui/reveal';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

/**
 * "latest jobs" block on the home page. Reads a small random sample (max 2) of
 * active openings resolved in ShowcaseController::home and reuses the shared
 * JobCard so a home card always matches its listing view. Two jobs sit side by
 * side in a grid; a single job spans the full width. The whole section is hidden
 * when there are no open positions.
 */
export default function LatestJobs({ jobs }: { jobs: Job[] }) {
    const { t } = useTranslation();

    if ((jobs?.length ?? 0) === 0) {
        return null;
    }

    return (
        <section className="space-y-4">
            <header className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900 md:text-2xl dark:text-white">
                    {t('home.jobsTitle')}
                </h2>
                <Link
                    href="/school/jobs"
                    className="shrink-0 text-sm font-semibold text-brand-ink hover:underline"
                >
                    {t('home.viewAllJobs')}
                </Link>
            </header>
            <div
                className={
                    jobs.length === 1
                        ? 'grid gap-5'
                        : 'grid gap-5 md:grid-cols-1 lg:grid-cols-2'
                }
            >
                {jobs.map((job, index) => (
                    <Reveal key={job.id} delay={index * 50}>
                        <JobCard job={job} />
                    </Reveal>
                ))}
            </div>
        </section>
    );
}
