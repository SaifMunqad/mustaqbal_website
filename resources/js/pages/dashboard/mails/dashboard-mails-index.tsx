/**
 * Unified outbound mail inbox (`/mails`).
 *
 * Lists every email the app has sent — bulk campaigns, transactional replies and
 * system mail — as recorded by the mail-event listeners. Filter by delivery
 * status and search by recipient/subject/source. Read-only: bulk retry still
 * lives on the campaign page. The list auto-refreshes while any row is still
 * pending so the queue's progress is visible without a manual reload.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import ResourceFilterBar, {
    filterSelectClass,
} from '@/components/dashboard/resource-filter-bar';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MailRow {
    id: number;
    source?: string | null;
    subject?: string | null;
    recipients: string;
    status: string;
    error?: string | null;
    sent_at?: string | null;
    created_at: string;
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface MailIndexProps {
    logs: Paginator<MailRow>;
    filters: { status: string; q: string };
    counts: { all: number; pending: number; sent: number; failed: number };
    [key: string]: unknown;
}

const statusStyles: Record<string, string> = {
    sent: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    pending:
        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const STATUS_TABS = ['all', 'pending', 'sent', 'failed'] as const;

export default function DashboardMailsIndex() {
    const { logs, filters, counts } = usePage<MailIndexProps>().props;
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.q);
    const [status, setStatus] = useState(filters.status);

    const hasPending = logs.data.some((row) => row.status === 'pending');

    // Poll the first page while a send is still in flight so statuses update live.
    useEffect(() => {
        if (!hasPending) {
            return;
        }

        const interval = setInterval(
            () => router.reload({ only: ['logs', 'counts'] }),
            5000,
        );

        return () => clearInterval(interval);
    }, [hasPending]);

    const basePath = '/mails';

    const buildParams = (override: { status?: string; q?: string }) => {
        const params: Record<string, string> = {};
        const nextStatus = override.status ?? status;
        const nextSearch = override.q ?? search;

        if (nextStatus && nextStatus !== 'all') params.status = nextStatus;
        if (nextSearch) params.q = nextSearch;

        return params;
    };

    const goTo = (params: Record<string, string>) => {
        router.get(basePath, params, { preserveState: true, replace: true });
    };

    const applyFilters = () => goTo(buildParams({}));

    const selectTab = (tab: string) => {
        setStatus(tab);
        goTo(buildParams({ status: tab }));
    };

    const sourceLabel = (row: MailRow) =>
        row.source ?? t('dashboard.mails.system');

    // Follows the browser-stored calendar preference (Afghan Solar Hijri default).
    const formatDateTime = useDateFormatter({ timeStyle: 'short' });

    const when = (row: MailRow) => {
        const stamp = row.sent_at ?? row.created_at;

        return formatDateTime(stamp);
    };

    const columns: DataTableColumn<MailRow>[] = [
        {
            key: 'id',
            header: '#',
            cell: (row) => row.id,
            sortValue: (row) => row.id,
        },
        {
            key: 'source',
            header: t('dashboard.mails.source'),
            cell: (row) => sourceLabel(row),
            sortValue: (row) => sourceLabel(row),
        },
        {
            key: 'subject',
            header: t('dashboard.mails.subject'),
            cell: (row) => row.subject ?? '-',
            sortValue: (row) => row.subject ?? '',
        },
        {
            key: 'recipients',
            header: t('dashboard.mails.recipient'),
            cell: (row) => (
                <span className="line-clamp-1 max-w-xs" title={row.recipients}>
                    {row.recipients}
                </span>
            ),
            sortValue: (row) => row.recipients,
        },
        {
            key: 'status',
            header: t('dashboard.mails.status'),
            cell: (row) => (
                <span
                    className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyles[row.status] ?? ''}`}
                    title={row.error ?? undefined}
                >
                    {row.status}
                </span>
            ),
            sortValue: (row) => row.status,
        },
        {
            key: 'when',
            header: t('dashboard.mails.when'),
            cell: (row) => when(row),
            sortValue: (row) => row.sent_at ?? row.created_at,
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.mails.title"
            breadcrumbs={[{ title: t('dashboard.title'), href: '/dashboard' }]}
        >
            <p className="text-sm text-muted-foreground">
                {t('dashboard.mails.subtitle')}
            </p>

            <div className="flex flex-wrap gap-2">
                {STATUS_TABS.map((tab) => {
                    const active = (status || 'all') === tab;

                    return (
                        <Button
                            key={tab}
                            type="button"
                            size="sm"
                            variant={active ? 'default' : 'outline'}
                            onClick={() => selectTab(tab)}
                        >
                            {t(`dashboard.mails.tabs.${tab}`)}
                            <span className="ms-1.5 text-xs opacity-70">
                                {counts[tab]}
                            </span>
                        </Button>
                    );
                })}
            </div>

            <ResourceFilterBar
                search={search}
                onSearchChange={setSearch}
                onApply={applyFilters}
                placeholder={t('dashboard.mails.searchPlaceholder')}
            >
                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className={filterSelectClass}
                >
                    <option value="">{t('dashboard.mails.tabs.all')}</option>
                    <option value="pending">
                        {t('dashboard.mails.tabs.pending')}
                    </option>
                    <option value="sent">
                        {t('dashboard.mails.tabs.sent')}
                    </option>
                    <option value="failed">
                        {t('dashboard.mails.tabs.failed')}
                    </option>
                </select>
            </ResourceFilterBar>

            <DataTable
                data={logs.data}
                columns={columns}
                rowKey={(row) => row.id}
                defaultSort={{ key: 'id', direction: 'desc' }}
                emptyMessage={t('dashboard.mails.empty')}
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    {logs.from && logs.to
                        ? t('dashboard.mails.showing', {
                              from: logs.from,
                              to: logs.to,
                              total: logs.total,
                          })
                        : t('dashboard.mails.showingNone')}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!logs.prev_page_url}
                        onClick={() =>
                            logs.prev_page_url &&
                            router.get(
                                logs.prev_page_url,
                                {},
                                { preserveState: true },
                            )
                        }
                    >
                        <ChevronLeft className="size-4 rtl:rotate-180" />
                    </Button>
                    <span>
                        {t('dashboard.mails.page', {
                            current: logs.current_page,
                            last: logs.last_page,
                        })}
                    </span>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!logs.next_page_url}
                        onClick={() =>
                            logs.next_page_url &&
                            router.get(
                                logs.next_page_url,
                                {},
                                { preserveState: true },
                            )
                        }
                    >
                        <ChevronRight className="size-4 rtl:rotate-180" />
                    </Button>
                </div>
            </div>
        </DashboardPage>
    );
}
