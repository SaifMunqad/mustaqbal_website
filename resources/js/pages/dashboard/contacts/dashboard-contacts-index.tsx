import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface Contact {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    resolved_at?: string | null;
}

export default function DashboardContactsIndex() {
    const { contacts } = usePage<{ contacts: { data: Contact[] } }>().props;
    const { t } = useTranslation();

    const columns: DataTableColumn<Contact>[] = [
        { key: 'id', header: '#', cell: (contact) => contact.id, sortValue: (contact) => contact.id },
        { key: 'name', header: t('dashboard.table.name'), cell: (contact) => contact.name, sortValue: (contact) => contact.name },
        {
            key: 'email',
            header: t('dashboard.table.email'),
            cell: (contact) => contact.email,
            sortValue: (contact) => contact.email,
        },
        {
            key: 'phone',
            header: t('dashboard.table.phone'),
            cell: (contact) => contact.phone ?? '-',
            sortValue: (contact) => contact.phone ?? '',
        },
        {
            key: 'resolved',
            header: t('dashboard.table.resolved'),
            cell: (contact) =>
                contact.resolved_at
                    ? t('dashboard.table.yes')
                    : t('dashboard.table.no'),
            sortValue: (contact) => Boolean(contact.resolved_at),
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (contact) => (
                <Link href={`/dashboard/contacts/${contact.id}/edit`} className="text-blue-600 underline">{t('dashboard.table.edit')}</Link>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.contacts.title"
            createHref="/dashboard/contacts/create"
            createLabelKey="dashboard.actions.newContact"
        >
            <DataTable
                data={contacts.data}
                columns={columns}
                rowKey={(contact) => contact.id}
                defaultSort={{ key: 'id', direction: 'asc' }}
            />
        </DashboardPage>
    );
}

