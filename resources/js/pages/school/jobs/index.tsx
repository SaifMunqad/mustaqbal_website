import JobCard, { type Job } from '@/components/school/job-card';
import MainLayout from '@/layouts/app/main-layout';
import { Head, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface SchoolJobsProps {
    jobs: Job[];
    [key: string]: unknown;
}

function SchoolJobs() {
    const { jobs } = usePage<SchoolJobsProps>().props;
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

SchoolJobs.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolJobs;
