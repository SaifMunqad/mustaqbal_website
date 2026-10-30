/**
 * Job posting listing with the shared search/filter toolbar.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import ResourceFilterBar from '@/components/dashboard/resource-filter-bar';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface JobRow {
    id: number;
    title: string;
    department?: string | null;
    category?: string | null;
    category_label?: string | null;
    employment_type: string;
    working_hours?: string | null;
    deadline?: string | null;
    is_active: boolean;
    author?: string | null;
    created_at: string;
}

interface JobsIndexProps {
    jobs: { data: JobRow[] };
    filters: { search: string };
    [key: string]: unknown;
}

export default function DashboardJobsIndex() {
    const { jobs, filters } = usePage<JobsIndexProps>().props;
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search);

    // Follows the browser-stored calendar preference (Afghan Solar Hijri default).
    const formatDate = useDateFormatter();

    const columns: DataTableColumn<JobRow>[] = [
        {
            key: 'id',
            header: '#',
            cell: (row) => row.id,
            sortValue: (row) => row.id,
        },
        {
            key: 'title',
            header: t('dashboard.table.title'),
            cell: (row) => row.title,
            sortValue: (row) => row.title,
        },
        {
            key: 'department',
            header: t('dashboard.table.department'),
            cell: (row) => row.department ?? '-',
            sortValue: (row) => row.department ?? '',
        },
        {
            key: 'category',
            header: t('dashboard.table.category'),
            cell: (row) =>
                row.category_label ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                        {row.category_label}
                    </span>
                ) : (
                    '-'
                ),
            sortValue: (row) => row.category_label ?? '',
        },
        {
            key: 'employment_type',
            header: t('dashboard.table.type'),
            cell: (row) => (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                    {t(
                        `jobs.employmentType.${row.employment_type}`,
                        row.employment_type,
                    )}
                </span>
            ),
            sortValue: (row) => row.employment_type,
        },
        {
            key: 'deadline',
            header: t('dashboard.table.deadline'),
            cell: (row) => (row.deadline ? formatDate(row.deadline) : '-'),
            sortValue: (row) => row.deadline ?? '',
        },
        {
            key: 'working_hours',
            header: t('dashboard.table.hours'),
            cell: (row) =>
                row.employment_type === 'part_time' && row.working_hours ? (
                    <span className="text-sm">{row.working_hours}</span>
                ) : (
                    '-'
                ),
            sortValue: (row) => row.working_hours ?? '',
        },
        {
            key: 'is_active',
            header: t('dashboard.table.status'),
            cell: (row) => (
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
                >
                    {row.is_active
                        ? t('dashboard.table.active')
                        : t('dashboard.table.inactive')}
                </span>
            ),
            sortValue: (row) => row.is_active,
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (row) => (
                <div className="flex flex-wrap gap-3">
                    <Link
                        href={`/dashboard/jobs/${row.id}/applications`}
                        className="text-blue-600 underline"
                    >
                        {t('dashboard.tabs.jobApplications')}
                    </Link>
                    <Link
                        href={`/dashboard/jobs/${row.id}/edit`}
                        className="text-blue-600 underline"
                    >
                        {t('dashboard.table.edit')}
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.jobs.title"
            createHref="/dashboard/jobs/create"
            createLabelKey="dashboard.actions.newJob"
            actions={
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/jobs/applications">
                        {t('dashboard.tabs.jobApplications')}
                    </Link>
                </Button>
            }
        >
            <ResourceFilterBar
                search={search}
                onSearchChange={setSearch}
                onApply={() =>
                    router.get(
                        '/dashboard/jobs',
                        { search },
                        { preserveState: true, replace: true },
                    )
                }
                placeholder={t('dashboard.table.searchJobs')}
            />

            <DataTable
                data={jobs.data}
                columns={columns}
                rowKey={(row) => row.id}
                defaultSort={{ key: 'id', direction: 'desc' }}
            />
        </DashboardPage>
    );
}
