/**
 * Account listing with role and status filters on top of the shared search bar.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import ResourceFilterBar, { filterSelectClass } from '@/components/dashboard/resource-filter-bar';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Account {
    id: number;
    name: string;
    email: string;
    role: string;
    status?: string | null;
    email_verified_at?: string | null;
    created_at: string;
}

interface UserOption {
    value: string;
    label: string;
    labelKey?: string;
}

interface UsersIndexProps {
    users: { data: Account[] };
    roleOptions: UserOption[];
    statusOptions: UserOption[];
    filters: { search: string; role: string; status: string };
    [key: string]: unknown;
}

const statusStyles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function DashboardUsersIndex() {
    const { t } = useTranslation();
    const { users, roleOptions, statusOptions, filters } = usePage<UsersIndexProps>().props;
    const [search, setSearch] = useState(filters.search);
    const [role, setRole] = useState(filters.role);
    const [status, setStatus] = useState(filters.status);

    const applyFilters = () => {
        router.get('/dashboard/users', { search, role, status }, { preserveState: true, replace: true });
    };

    const columns: DataTableColumn<Account>[] = [
        { key: 'id', header: '#', cell: (user) => user.id, sortValue: (user) => user.id },
        { key: 'name', header: t('dashboard.table.name'), cell: (user) => user.name, sortValue: (user) => user.name },
        { key: 'email', header: t('dashboard.table.email'), cell: (user) => user.email, sortValue: (user) => user.email },
        {
            key: 'role',
            header: t('dashboard.users.form.role'),
            cell: (user) => {
                const option = roleOptions.find((o) => o.value === user.role);
                return option ? t(option.labelKey ?? option.label, option.label) : user.role;
            },
            sortValue: (user) => user.role,
        },
        {
            key: 'status',
            header: t('dashboard.users.form.status'),
            cell: (user) => (
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        statusStyles[user.status ?? 'active'] ?? 'bg-slate-100 text-slate-700'
                    }`}
                >
                    {t(`enums.userStatus.${user.status ?? 'active'}`, user.status ?? 'active')}
                </span>
            ),
            sortValue: (user) => user.status ?? 'active',
        },
        {
            key: 'verified',
            header: t('dashboard.table.verified'),
            cell: (user) =>
                user.email_verified_at
                    ? t('dashboard.table.yes')
                    : t('dashboard.table.no'),
            sortValue: (user) => Boolean(user.email_verified_at),
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (user) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/users/${user.id}/edit`} className="text-blue-600 underline">
                        {t('dashboard.table.edit')}
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
            <ResourceFilterBar
                search={search}
                onSearchChange={setSearch}
                onApply={applyFilters}
                placeholder={t('dashboard.table.searchNameOrEmail')}
            >
                <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className={filterSelectClass}
                >
                    <option value="">{t('dashboard.table.allRoles')}</option>
                    {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {t(option.labelKey ?? option.label, option.label)}
                        </option>
                    ))}
                </select>
                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className={filterSelectClass}
                >
                    <option value="">{t('dashboard.table.allStatuses')}</option>
                    {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {t(option.labelKey ?? option.label, option.label)}
                        </option>
                    ))}
                </select>
            </ResourceFilterBar>

            <DataTable
                data={users.data}
                columns={columns}
                rowKey={(user) => user.id}
                defaultSort={{ key: 'id', direction: 'asc' }}
            />
        </DashboardPage>
    );
}
