/**
 * Dashboard listing of school enrollment enquiries.
 *
 * Searches families by student/guardian name, email, phone or grade, filters by
 * triage status, marks a status inline, and links to the detail screen where an
 * admin/employee can read the enquiry and reply to the guardian.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import ResourceFilterBar, { filterSelectClass } from '@/components/dashboard/resource-filter-bar';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EnrollmentRow {
    id: number;
    student_name: string;
    guardian_name: string;
    email: string;
    phone: string;
    grade: string;
    status: string;
    replies_count: number;
    created_at: string;
}

interface StatusOption {
    value: string;
    label: string;
    labelKey: string;
}

interface EnrollmentsIndexProps {
    enrollments: { data: EnrollmentRow[] };
    filters: { search: string; status: string };
    statuses: StatusOption[];
    [key: string]: unknown;
}

const statusStyles: Record<string, string> = {
    new: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    messaged: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    on_hold: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

const formatDate = (value?: string | null): string =>
    value ? new Date(value).toLocaleDateString() : '';

export default function DashboardEnrollmentsIndex() {
    const { enrollments, filters, statuses } =
        usePage<EnrollmentsIndexProps>().props;
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);

    const basePath = '/dashboard/enrollments';

    const applyFilters = () => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (status) params.status = status;
        router.get(basePath, params, { preserveState: true, replace: true });
    };

    const statusLabel = (option: StatusOption) => t(option.labelKey, option.label);

    const columns: DataTableColumn<EnrollmentRow>[] = [
        { key: 'id', header: '#', cell: (row) => row.id, sortValue: (row) => row.id },
        {
            key: 'student_name',
            header: t('dashboard.enrollments.fields.studentName'),
            cell: (row) => (
                <Link href={`/dashboard/enrollments/${row.id}`} className="text-blue-600 underline">
                    {row.student_name}
                </Link>
            ),
            sortValue: (row) => row.student_name,
        },
        {
            key: 'guardian_name',
            header: t('dashboard.enrollments.fields.guardianName'),
            cell: (row) => row.guardian_name,
            sortValue: (row) => row.guardian_name,
        },
        { key: 'email', header: t('dashboard.enrollments.fields.email'), cell: (row) => row.email, sortValue: (row) => row.email },
        { key: 'phone', header: t('dashboard.enrollments.fields.phone'), cell: (row) => row.phone, sortValue: (row) => row.phone },
        { key: 'grade', header: t('dashboard.enrollments.fields.grade'), cell: (row) => row.grade, sortValue: (row) => row.grade },
        {
            key: 'replies',
            header: t('dashboard.enrollments.show.replies'),
            cell: (row) => row.replies_count,
            sortValue: (row) => row.replies_count,
        },
        {
            key: 'created_at',
            header: t('dashboard.enrollments.submittedOn'),
            cell: (row) => formatDate(row.created_at),
            sortValue: (row) => row.created_at,
        },
        {
            key: 'status',
            header: t('dashboard.enrollments.fields.status'),
            cell: (row) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[row.status] ?? statusStyles.new}`}>
                    {t(`enums.enrollmentStatus.${row.status}`, row.status)}
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
                            `/dashboard/enrollments/${row.id}/status`,
                            { status: event.target.value },
                            { preserveScroll: true, preserveState: true },
                        )
                    }
                    className={filterSelectClass}
                    aria-label={t('dashboard.enrollments.markStatus')}
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
            titleKey="dashboard.enrollments.title"
            breadcrumbs={[{ title: t('dashboard.title'), href: '/dashboard' }]}
        >
            <p className="text-sm text-muted-foreground">
                {t('dashboard.enrollments.subtitle')}
            </p>

            <ResourceFilterBar
                search={search}
                onSearchChange={setSearch}
                onApply={applyFilters}
                placeholder={t('dashboard.enrollments.searchPlaceholder')}
            >
                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className={filterSelectClass}
                >
                    <option value="">{t('dashboard.enrollments.allStatuses')}</option>
                    {statuses.map((option) => (
                        <option key={option.value} value={option.value}>
                            {statusLabel(option)}
                        </option>
                    ))}
                </select>
            </ResourceFilterBar>

            <DataTable
                data={enrollments.data}
                columns={columns}
                rowKey={(row) => row.id}
                defaultSort={{ key: 'id', direction: 'desc' }}
                emptyMessage={t('dashboard.enrollments.empty')}
            />
        </DashboardPage>
    );
}
