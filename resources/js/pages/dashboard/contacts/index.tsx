import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, usePage } from '@inertiajs/react';

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

    const columns: DataTableColumn<Contact>[] = [
        { key: 'id', header: '#', cell: (contact) => contact.id, sortValue: (contact) => contact.id },
        { key: 'name', header: 'Name', cell: (contact) => contact.name, sortValue: (contact) => contact.name },
        {
            key: 'email',
            header: 'Email',
            cell: (contact) => contact.email,
            sortValue: (contact) => contact.email,
        },
        {
            key: 'phone',
            header: 'Phone',
            cell: (contact) => contact.phone ?? '-',
            sortValue: (contact) => contact.phone ?? '',
        },
        {
            key: 'resolved',
            header: 'Resolved',
            cell: (contact) => (contact.resolved_at ? 'Yes' : 'No'),
            sortValue: (contact) => Boolean(contact.resolved_at),
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (contact) => (
                <Link href={`/dashboard/contacts/${contact.id}/edit`} className="text-blue-600 underline">Edit</Link>
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

