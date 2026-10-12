import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Account {
    id: number;
    name: string;
    email: string;
    role: string;
    status?: string | null;
    email_verified_at?: string | null;
    created_at: string;
}

interface Option {
    value: string;
    label: string;
}

interface Props {
    users: { data: Account[] };
    roleOptions: Option[];
    statusOptions: Option[];
    filters: { search: string; role: string; status: string };
    [key: string]: unknown;
}

const statusStyles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function DashboardUsersIndex() {
    const { users, roleOptions, statusOptions, filters } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search);
    const [role, setRole] = useState(filters.role);
    const [status, setStatus] = useState(filters.status);

    const applyFilters = () => {
        router.get('/dashboard/users', { search, role, status }, { preserveState: true, replace: true });
    };

    const columns: DataTableColumn<Account>[] = [
        { key: 'id', header: '#', cell: (user) => user.id, sortValue: (user) => user.id },
        { key: 'name', header: 'Name', cell: (user) => user.name, sortValue: (user) => user.name },
        { key: 'email', header: 'Email', cell: (user) => user.email, sortValue: (user) => user.email },
        {
            key: 'role',
            header: 'Role',
            cell: (user) => roleOptions.find((option) => option.value === user.role)?.label ?? user.role,
            sortValue: (user) => user.role,
        },
        {
            key: 'status',
            header: 'Status',
            cell: (user) => (
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        statusStyles[user.status ?? 'active'] ?? 'bg-slate-100 text-slate-700'
                    }`}
                >
                    {user.status ?? 'active'}
                </span>
            ),
            sortValue: (user) => user.status ?? 'active',
        },
        {
            key: 'verified',
            header: 'Verified',
            cell: (user) => (user.email_verified_at ? 'Yes' : 'No'),
            sortValue: (user) => Boolean(user.email_verified_at),
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (user) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/users/${user.id}/edit`} className="text-blue-600 underline">
                        Edit
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.users.title"
            createHref="/dashboard/users/create"
            createLabelKey="dashboard.actions.newUser"
        >
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-3">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name or email"
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none"
                >
                    <option value="">All roles</option>
                    {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none"
                >
                    <option value="">All statuses</option>
                    {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={applyFilters}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
                >
                    Filter
                </button>
            </div>

            <DataTable
                data={users.data}
                columns={columns}
                rowKey={(user) => user.id}
                defaultSort={{ key: 'id', direction: 'asc' }}
            />
        </DashboardPage>
    );
}
