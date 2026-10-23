import JobCard, { type Job } from '@/components/school/job-card';
import InfiniteScrollFooter from '@/components/ui/infinite-scroll-footer';
import Reveal from '@/components/ui/reveal';
import { useInfinitePagination } from '@/hooks/use-infinite-pagination';
import MainLayout from '@/layouts/app/main-layout';
import type { Paginated } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface SchoolJobsProps {
    jobs: Paginated<Job>;
    [key: string]: unknown;
}

function SchoolJobs() {
    const { jobs } = usePage<SchoolJobsProps>().props;
    const { t } = useTranslation();
    const { items, sentinelRef, loading, hasMore, error, loadMore } =
        useInfinitePagination(jobs, { prop: 'jobs' });

    return (
        <>
            <Head title={t('navigation.jobs')} />
            <section className="space-y-6">
                <Reveal direction="fade" defaultInView>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {t('navigation.jobs')}
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            {t('navigationDescriptions.jobs')}
                        </p>
                    </div>
                </Reveal>

                {items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        {t('jobs.empty')}
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-2">
                        {items.map((job, index) => (
                            <Reveal key={job.id} delay={index * 40}>
                                <JobCard job={job} />
                            </Reveal>
                        ))}
                    </div>
                )}

                <InfiniteScrollFooter
                    sentinelRef={sentinelRef}
                    loading={loading}
                    hasMore={hasMore}
                    error={error}
                    onLoadMore={loadMore}
                    showEnd={jobs.last_page > 1}
                />
            </section>
        </>
    );
}

SchoolJobs.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolJobs;
