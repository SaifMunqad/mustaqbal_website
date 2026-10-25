/**
 * Dashboard listing of job applications ("Jobs → Applied").
 *
 * Filters by job and status, searches candidates by name/father name/email/
 * phone, marks a status inline, and links out to the bulk-email composer
 * pre-scoped to the applicants currently marked as selected.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import ResourceFilterBar, { filterSelectClass } from '@/components/dashboard/resource-filter-bar';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ApplicationRow {
    id: number;
    full_name: string;
    first_name: string;
    last_name: string;
    father_name: string;
    email: string;
    phone: string;
    city?: string | null;
    status: string;
    job_id: number;
    job_title?: string | null;
    documents_count: number;
    created_at: string;
}

interface StatusOption {
    value: string;
    label: string;
    labelKey: string;
}

interface JobApplicationIndexProps {
    applications: { data: ApplicationRow[] };
    job: { id: number; title: string } | null;
    filters: { search: string; status: string };
    jobs: Array<{ id: number; title: string }>;
    statuses: StatusOption[];
    selectedCount: number;
    [key: string]: unknown;
}

const statusStyles: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    read: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    selected: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    queued: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

export default function DashboardJobApplicationsIndex() {
    const { applications, job, filters, jobs, statuses, selectedCount } =
        usePage<JobApplicationIndexProps>().props;
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [jobFilter, setJobFilter] = useState(job ? String(job.id) : '');

    const basePath = '/dashboard/jobs/applications';

    const applyFilters = () => {
        const params: Record<string, string> = {};

        if (search) params.search = search;
        if (status) params.status = status;

        if (jobFilter) {
            router.get(`/dashboard/jobs/${jobFilter}/applications`, params, {
                preserveState: true,
                replace: true,
            });
            return;
        }

        router.get(basePath, params, { preserveState: true, replace: true });
    };

    const statusLabel = (option: StatusOption) => t(option.labelKey, option.label);

    const columns: DataTableColumn<ApplicationRow>[] = [
        { key: 'id', header: '#', cell: (row) => row.id, sortValue: (row) => row.id },
        {
            key: 'candidate',
            header: t('dashboard.jobApplications.fields.candidate'),
            cell: (row) => (
                <Link href={`/dashboard/applications/${row.id}`} className="text-blue-600 underline">
                    {row.full_name}
                </Link>
            ),
            sortValue: (row) => row.full_name,
        },
        { key: 'father_name', header: t('dashboard.jobApplications.fields.fatherName'), cell: (row) => row.father_name, sortValue: (row) => row.father_name },
        { key: 'email', header: t('dashboard.jobApplications.fields.email'), cell: (row) => row.email, sortValue: (row) => row.email },
        { key: 'phone', header: t('dashboard.jobApplications.fields.phone'), cell: (row) => row.phone, sortValue: (row) => row.phone },
        { key: 'job_title', header: t('dashboard.jobApplications.appliedFor'), cell: (row) => row.job_title ?? '-', sortValue: (row) => row.job_title ?? '' },
        {
            key: 'documents',
            header: t('dashboard.jobApplications.documents'),
            cell: (row) => row.documents_count,
            sortValue: (row) => row.documents_count,
        },
        {
            key: 'status',
            header: t('dashboard.jobApplications.fields.status'),
            cell: (row) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[row.status] ?? statusStyles.pending}`}>
                    {t(`enums.jobApplicationStatus.${row.status}`, row.status)}
                </span>
            ),
            sortValue: (row) => row.status,
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (row) => (
                <select
                    value={row.status}
                    onChange={(event) =>
                        router.put(
                            `/dashboard/applications/${row.id}/status`,
                            { status: event.target.value },
                            { preserveScroll: true, preserveState: true },
                        )
                    }
                    className={filterSelectClass}
                    aria-label={t('dashboard.jobApplications.markStatus')}
                >
                    {statuses.map((option) => (
                        <option key={option.value} value={option.value}>
                            {statusLabel(option)}
                        </option>
                    ))}
                </select>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.jobApplications.title"
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                { title: t('dashboard.tabs.jobs'), href: '/dashboard/jobs' },
            ]}
            actions={
                selectedCount > 0 ? (
                    <Button asChild size="sm">
                        <Link
                            href={`/dashboard/email-campaigns/create?recipient_source=selected_applicants${job ? `&job_id=${job.id}` : ''}`}
                            prefetch
                        >
                            {t('dashboard.jobApplications.emailSelected')}
                        </Link>
                    </Button>
                ) : null
            }
        >
            <p className="text-sm text-muted-foreground">
                {t('dashboard.jobApplications.subtitle')}
            </p>

            <ResourceFilterBar
                search={search}
                onSearchChange={setSearch}
                onApply={applyFilters}
                placeholder={t('dashboard.jobApplications.searchPlaceholder')}
            >
                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className={filterSelectClass}
                >
                    <option value="">{t('dashboard.jobApplications.allStatuses')}</option>
                    {statuses.map((option) => (
                        <option key={option.value} value={option.value}>
                            {statusLabel(option)}
                        </option>
                    ))}
                </select>

                {!job ? (
                    <select
                        value={jobFilter}
                        onChange={(event) => setJobFilter(event.target.value)}
                        className={filterSelectClass}
                    >
                        <option value="">{t('dashboard.jobApplications.allJobs')}</option>
                        {jobs.map((entry) => (
                            <option key={entry.id} value={String(entry.id)}>
                                {entry.title}
                            </option>
                        ))}
                    </select>
                ) : null}
            </ResourceFilterBar>

            <DataTable
                data={applications.data}
                columns={columns}
                rowKey={(row) => row.id}
                defaultSort={{ key: 'id', direction: 'desc' }}
                emptyMessage={t('dashboard.jobApplications.empty')}
            />
        </DashboardPage>
    );
}
