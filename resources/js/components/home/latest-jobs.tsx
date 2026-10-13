import JobCard, { type Job } from '@/components/school/job-card';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

/**
 * Automatic "latest jobs" block on the home page. Reads live, active openings
 * resolved in ShowcaseController::home (same ordering/visibility as the public
 * jobs listing) and reuses the shared JobCard so a home card always matches its
 * listing view. The whole section is hidden when there are no open positions.
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
                    className="shrink-0 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
                >
                    {t('home.viewAllJobs')}
                </Link>
            </header>
            <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-2">
                {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
            </div>
        </section>
    );
}
