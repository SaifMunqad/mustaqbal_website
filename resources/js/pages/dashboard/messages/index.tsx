import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, usePage } from '@inertiajs/react';

interface Message {
    id: number;
    body: string;
    read_at?: string | null;
    author?: { name: string } | null;
    conversation?: { topic?: string | null } | null;
}

export default function DashboardMessagesIndex() {
    const { messages } = usePage<{ messages: { data: Message[] } }>().props;

    const columns: DataTableColumn<Message>[] = [
        { key: 'id', header: '#', cell: (message) => message.id, sortValue: (message) => message.id },
        {
            key: 'conversation',
            header: 'Conversation',
            cell: (message) => message.conversation?.topic ?? '-',
            sortValue: (message) => message.conversation?.topic ?? '',
        },
        {
            key: 'author',
            header: 'Author',
            cell: (message) => message.author?.name ?? '-',
            sortValue: (message) => message.author?.name ?? '',
        },
        {
            key: 'body',
            header: 'Body',
            cell: (message) => message.body.slice(0, 80),
            sortValue: (message) => message.body,
        },
        {
            key: 'read',
            header: 'Read',
            cell: (message) => (message.read_at ? 'Yes' : 'No'),
            sortValue: (message) => Boolean(message.read_at),
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (message) => (
                <Link href={`/dashboard/messages/${message.id}/edit`} className="text-blue-600 underline">Edit</Link>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.messages.title"
            createHref="/dashboard/messages/create"
            createLabelKey="dashboard.actions.newMessage"
        >
            <DataTable
                data={messages.data}
                columns={columns}
                rowKey={(message) => message.id}
                defaultSort={{ key: 'id', direction: 'asc' }}
            />
        </DashboardPage>
    );
}

