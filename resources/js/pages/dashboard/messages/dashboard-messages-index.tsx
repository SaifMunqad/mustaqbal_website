/**
 * Message listing across conversations, including answers where present.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface MessageAnswer {
    id: number;
    body: string;
    answered_at?: string | null;
    author?: { name: string } | null;
}

interface Message {
    id: number;
    body: string;
    read_at?: string | null;
    author?: { name: string } | null;
    conversation?: { topic?: string | null } | null;
    sender_name?: string | null;
    sender_email?: string | null;
    subject?: string | null;
    answers?: MessageAnswer[];
}

const formatDate = (value?: string | null): string => {
    if (!value) return '';
    return new Date(value).toLocaleDateString();
};

export default function DashboardMessagesIndex() {
    const { messages, box } = usePage<{ messages: { data: Message[] }; box: 'incoming' | 'sent' }>().props;
    const { t } = useTranslation();

    const boxes: { key: 'incoming' | 'sent'; href: string }[] = [
        { key: 'incoming', href: '/dashboard/messages?box=incoming' },
        { key: 'sent', href: '/dashboard/messages?box=sent' },
    ];

    const columns: DataTableColumn<Message>[] = [
        { key: 'id', header: '#', cell: (message) => message.id, sortValue: (message) => message.id },
        {
            key: 'conversation',
            header: t('dashboard.table.conversation'),
            cell: (message) => message.conversation?.topic ?? message.subject ?? '-',
            sortValue: (message) => message.conversation?.topic ?? message.subject ?? '',
        },
        {
            key: 'author',
            header: t('dashboard.table.author'),
            cell: (message) => message.author?.name ?? message.sender_name ?? '-',
            sortValue: (message) => message.author?.name ?? message.sender_name ?? '',
        },
        {
            key: 'body',
            header: t('dashboard.table.body'),
            cell: (message) => message.body.slice(0, 80),
            sortValue: (message) => message.body,
        },
        {
            key: 'read',
            header: t('dashboard.table.read'),
            cell: (message) =>
                message.read_at
                    ? t('dashboard.table.yes')
                    : t('dashboard.table.no'),
            sortValue: (message) => Boolean(message.read_at),
        },
        {
            key: 'answer',
            header: t('dashboard.table.answer'),
            cell: (message) => {
                const answer = message.answers?.[0];
                if (!answer) return <span className="text-slate-400">—</span>;
                return (
                    <div className="space-y-0.5">
                        <p className="line-clamp-2">{answer.body.slice(0, 80)}</p>
                        <p className="text-xs text-slate-500">{formatDate(answer.answered_at)}</p>
                    </div>
                );
            },
            sortValue: (message) => message.answers?.[0]?.answered_at ?? '',
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (message) => {
                const answered = (message.answers?.length ?? 0) > 0;
                return (
                    <Link
                        href={`/dashboard/messages/${message.id}`}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                    >
                        {answered
                            ? t('dashboard.table.viewAnswers')
                            : t('dashboard.table.answer')}
                    </Link>
                );
            },
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.messages.title"
            createHref="/dashboard/messages/create"
            createLabelKey="dashboard.actions.newMessage"
        >
            <div className="flex gap-2">
                {boxes.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={`rounded-lg px-3 py-1.5 text-sm transition ${
                            box === item.key
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {t(`dashboard.messages.${item.key}`)}
                    </Link>
                ))}
            </div>
            <DataTable
                data={messages.data}
                columns={columns}
                rowKey={(message) => message.id}
                defaultSort={{ key: 'id', direction: 'asc' }}
            />
        </DashboardPage>
    );
}

