import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Button } from '@/components/ui/button';
import campaigns from '@/routes/dashboard/whatsapp-campaigns';
import { Form, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

interface Campaign {
    id: number;
    mode: string;
    message?: string | null;
    template_name?: string | null;
    template_language?: string | null;
    template_variables?: string[] | null;
    recipient_source: string;
    total_count: number;
    sent_count: number;
    failed_count: number;
    status: string;
    created_at: string;
    creator?: { name: string } | null;
}

interface Recipient {
    id: number;
    name?: string | null;
    phone: string;
    status: string;
    error?: string | null;
    sent_at?: string | null;
}

const statusStyles: Record<string, string> = {
    sent: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export default function DashboardWhatsAppCampaignsShow() {
    const { campaign, recipients } = usePage<{
        campaign: Campaign;
        recipients: { data: Recipient[] };
    }>().props;

    const pending = Math.max(0, campaign.total_count - campaign.sent_count - campaign.failed_count);
    const processed = campaign.sent_count + campaign.failed_count;
    const percent = campaign.total_count > 0 ? Math.round((processed / campaign.total_count) * 100) : 0;

    // Keep the page fresh while the queue is still working through recipients.
    useEffect(() => {
        if (pending === 0) {
            return;
        }

        const interval = setInterval(() => {
            router.reload({ only: ['campaign', 'recipients'] });
        }, 5000);

        return () => clearInterval(interval);
    }, [pending]);

    const columns: DataTableColumn<Recipient>[] = [
        { key: 'id', header: '#', cell: (recipient) => recipient.id, sortValue: (recipient) => recipient.id },
        {
            key: 'name',
            header: 'Name',
            cell: (recipient) => recipient.name ?? '-',
            sortValue: (recipient) => recipient.name ?? '',
        },
        { key: 'phone', header: 'Number', cell: (recipient) => recipient.phone, sortValue: (recipient) => recipient.phone },
        {
            key: 'status',
            header: 'Status',
            cell: (recipient) => (
                <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyles[recipient.status] ?? ''}`}>
                    {recipient.status}
                </span>
            ),
            sortValue: (recipient) => recipient.status,
        },
        {
            key: 'sent_at',
            header: 'Sent at',
            cell: (recipient) => (recipient.sent_at ? new Date(recipient.sent_at).toLocaleString() : '-'),
            sortValue: (recipient) => recipient.sent_at ?? '',
        },
        {
            key: 'error',
            header: 'Error',
            cell: (recipient) => (recipient.error ? recipient.error.slice(0, 60) : '-'),
            sortValue: (recipient) => recipient.error ?? '',
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.whatsappCampaigns.showTitle"
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Bulk WhatsApp', href: campaigns.index.url() },
            ]}
        >
            <div className="space-y-4 rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">
                        {campaign.mode === 'template'
                            ? `Template: ${campaign.template_name}`
                            : 'Free text message'}
                    </h2>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
                        {campaign.status === 'completed' ? 'Completed' : 'Sending…'}
                    </span>
                </div>

                <p className="text-sm text-slate-500">
                    Created by {campaign.creator?.name ?? 'Unknown'} on {new Date(campaign.created_at).toLocaleString()}
                </p>

                <div>
                    <div className="mb-1 flex justify-between text-sm">
                        <span>
                            {campaign.sent_count} sent · {campaign.failed_count} failed · {pending} pending
                        </span>
                        <span>{percent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                            className="h-full rounded-full bg-green-600 transition-all"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-line dark:bg-slate-800">
                    {campaign.mode === 'template' ? (
                        <>
                            <p>
                                Language: {campaign.template_language ?? '—'}
                            </p>
                            {campaign.template_variables && campaign.template_variables.length > 0 && (
                                <p className="mt-1">Variables: {campaign.template_variables.join(', ')}</p>
                            )}
                        </>
                    ) : (
                        campaign.message
                    )}
                </div>

                {campaign.failed_count > 0 && (
                    <Form {...campaigns.retry.form(campaign.id)} className="w-fit">
                        <Button type="submit" variant="outline" className="border-red-300 text-red-600">
                            Retry {campaign.failed_count} failed recipient(s)
                        </Button>
                    </Form>
                )}
            </div>

            <div className="rounded-xl border p-4">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">Recipients</h3>
                    <Link href={campaigns.create.url()} className="text-sm text-blue-600 underline">
                        New campaign
                    </Link>
                </div>
                <DataTable
                    data={recipients.data}
                    columns={columns}
                    rowKey={(recipient) => recipient.id}
                    defaultSort={{ key: 'id', direction: 'asc' }}
                />
            </div>
        </DashboardPage>
    );
}
