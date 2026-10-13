import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
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

const employmentTypeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
};

export default function DashboardJobsIndex() {
    const { jobs, filters } = usePage<JobsIndexProps>().props;
    const { i18n } = useTranslation();
    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;
    const [search, setSearch] = useState(filters.search);

    const formatDate = (value: string) => {
        try {
            return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
        } catch {
            return value;
        }
    };

    const columns: DataTableColumn<JobRow>[] = [
        { key: 'id', header: '#', cell: (row) => row.id, sortValue: (row) => row.id },
        { key: 'title', header: 'Title', cell: (row) => row.title, sortValue: (row) => row.title },
        { key: 'department', header: 'Department', cell: (row) => row.department ?? '-', sortValue: (row) => row.department ?? '' },
        {
            key: 'category',
            header: 'Category',
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
            header: 'Type',
            cell: (row) => (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                    {employmentTypeLabels[row.employment_type] ?? row.employment_type}
                </span>
            ),
            sortValue: (row) => row.employment_type,
        },
        { key: 'deadline', header: 'Deadline', cell: (row) => row.deadline ? formatDate(row.deadline) : '-', sortValue: (row) => row.deadline ?? '' },
        {
            key: 'working_hours',
            header: 'Hours',
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
            header: 'Status',
            cell: (row) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
            sortValue: (row) => row.is_active,
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (row) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/jobs/${row.id}/edit`} className="text-blue-600 underline">
                        Edit
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
        >
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-3">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search jobs"
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                    type="button"
                    onClick={() => router.get('/dashboard/jobs', { search }, { preserveState: true, replace: true })}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
                >
                    Filter
                </button>
            </div>

            <DataTable
                data={jobs.data}
                columns={columns}
                rowKey={(row) => row.id}
                defaultSort={{ key: 'id', direction: 'desc' }}
            />
        </DashboardPage>
    );
}
