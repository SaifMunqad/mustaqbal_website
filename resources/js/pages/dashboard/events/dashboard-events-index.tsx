import DashboardPage from '@/components/dashboard/dashboard-page';
import ResourceFilterBar from '@/components/dashboard/resource-filter-bar';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EventRow {
    id: number;
    title: string;
    start_at: string;
    audience?: string | null;
    status: string;
    is_published: boolean;
    is_cancelled: boolean;
    author?: string | null;
}

interface EventsIndexProps {
    events: { data: EventRow[] };
    filters: { search: string };
    [key: string]: unknown;
}

const statusStyles: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    ongoing: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    past: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function DashboardEventsIndex() {
    const { events, filters } = usePage<EventsIndexProps>().props;
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;
    const [search, setSearch] = useState(filters.search);

    const formatDate = (value: string) => {
        try {
            return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
        } catch {
            return value;
        }
    };

    const columns: DataTableColumn<EventRow>[] = [
        { key: 'id', header: '#', cell: (row) => row.id, sortValue: (row) => row.id },
        { key: 'title', header: t('dashboard.table.title'), cell: (row) => row.title, sortValue: (row) => row.title },
        { key: 'start', header: t('dashboard.table.starts'), cell: (row) => formatDate(row.start_at), sortValue: (row) => row.start_at },
        {
            key: 'status',
            header: t('dashboard.table.status'),
            cell: (row) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[row.status] ?? ''}`}>
                    {t(`enums.eventStatus.${row.status}`, row.status)}
                </span>
            ),
            sortValue: (row) => row.status,
        },
        {
            key: 'published',
            header: t('dashboard.table.published'),
            cell: (row) =>
                row.is_published
                    ? t('dashboard.table.yes')
                    : t('dashboard.articles.show.draft'),
            sortValue: (row) => row.is_published,
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (row) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/events/${row.id}/edit`} className="text-blue-600 underline">
                        {t('dashboard.table.edit')}
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.events.title"
            createHref="/dashboard/events/create"
            createLabelKey="dashboard.actions.newEvent"
        >
            <ResourceFilterBar
                search={search}
                onSearchChange={setSearch}
                onApply={() => router.get('/dashboard/events', { search }, { preserveState: true, replace: true })}
                placeholder={t('dashboard.table.searchEvents')}
            />

            <DataTable
                data={events.data}
                columns={columns}
                rowKey={(row) => row.id}
                defaultSort={{ key: 'start', direction: 'desc' }}
            />
        </DashboardPage>
    );
}
