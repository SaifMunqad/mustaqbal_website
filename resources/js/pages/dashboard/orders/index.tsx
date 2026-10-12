import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Row {
    id: number;
    order_number: string;
    customer_name: string;
    customer_email: string;
    status: string;
    payment_method: string;
    payment_status: string;
    total: number;
    items_count: number;
    placed_at: string;
}

interface Option {
    value: string;
    label: string;
}

interface Props {
    orders: { data: Row[] };
    statusOptions: Option[];
    filters: { status: string; search: string };
    [key: string]: unknown;
}

const formatMoney = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);

const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function DashboardOrdersIndex() {
    const { orders, statusOptions, filters } = usePage<Props>().props;
    const { i18n } = useTranslation();
    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);

    const formatDateTime = (value: string) => {
        try {
            return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
        } catch {
            return value;
        }
    };

    const applyFilters = () => router.get('/dashboard/orders', { search, status }, { preserveState: true, replace: true });

    const columns: DataTableColumn<Row>[] = [
        { key: 'number', header: 'Order', cell: (row) => row.order_number, sortValue: (row) => row.order_number },
        { key: 'customer', header: 'Customer', cell: (row) => row.customer_name, sortValue: (row) => row.customer_name },
        { key: 'items', header: 'Items', cell: (row) => row.items_count, sortValue: (row) => row.items_count },
        { key: 'total', header: 'Total', cell: (row) => `${formatMoney(row.total)} AFN`, sortValue: (row) => row.total },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[row.status] ?? ''}`}>
                    {statusOptions.find((option) => option.value === row.status)?.label ?? row.status}
                </span>
            ),
            sortValue: (row) => row.status,
        },
        { key: 'placed', header: 'Placed', cell: (row) => formatDateTime(row.placed_at), sortValue: (row) => row.placed_at },
        {
            key: 'actions',
            header: 'Actions',
            cell: (row) => (
                <Link href={`/dashboard/orders/${row.id}`} className="text-blue-600 underline">
                    View
                </Link>
            ),
        },
    ];

    return (
        <DashboardPage titleKey="dashboard.orders.title">
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-3">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search order, name, or email"
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none">
                    <option value="">All statuses</option>
                    {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <button type="button" onClick={applyFilters} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700">
                    Filter
                </button>
            </div>

            <DataTable data={orders.data} columns={columns} rowKey={(row) => row.id} defaultSort={{ key: 'placed', direction: 'desc' }} />
        </DashboardPage>
    );
}
