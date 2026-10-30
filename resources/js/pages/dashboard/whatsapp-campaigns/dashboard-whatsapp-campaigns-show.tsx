/**
 * WhatsApp campaign detail and delivery report.
 *
 * Displays the stored message exactly as it is sent, along with each recipient's
 * delivery state; the pending count is derived from the totals.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import campaigns from '@/routes/dashboard/whatsapp-campaigns';
import { Form, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
    pending:
        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export default function DashboardWhatsAppCampaignsShow() {
    const { t } = useTranslation();
    // Follows the browser-stored calendar preference (Afghan Solar Hijri default).
    const formatDateTime = useDateFormatter({ timeStyle: 'short' });
    const { campaign, messageText, recipients } = usePage<{
        campaign: Campaign;
        /** The stored body flattened to the exact WhatsApp markup that is sent. */
        messageText: string;
        recipients: { data: Recipient[] };
    }>().props;

    const pending = Math.max(
        0,
        campaign.total_count - campaign.sent_count - campaign.failed_count,
    );
    const processed = campaign.sent_count + campaign.failed_count;
    const percent =
        campaign.total_count > 0
            ? Math.round((processed / campaign.total_count) * 100)
            : 0;

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
        {
            key: 'id',
            header: '#',
            cell: (recipient) => recipient.id,
            sortValue: (recipient) => recipient.id,
        },
        {
            key: 'name',
            header: t('dashboard.table.name'),
            cell: (recipient) => recipient.name ?? '-',
            sortValue: (recipient) => recipient.name ?? '',
        },
        {
            key: 'phone',
            header: t('dashboard.whatsappCampaigns.table.number'),
            cell: (recipient) => recipient.phone,
            sortValue: (recipient) => recipient.phone,
        },
        {
            key: 'status',
            header: t('dashboard.table.status'),
            cell: (recipient) => (
                <span
                    className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyles[recipient.status] ?? ''}`}
                >
                    {recipient.status}
                </span>
            ),
            sortValue: (recipient) => recipient.status,
        },
        {
            key: 'sent_at',
            header: t('dashboard.emailCampaigns.show.sentAt'),
            cell: (recipient) =>
                recipient.sent_at ? formatDateTime(recipient.sent_at) : '-',
            sortValue: (recipient) => recipient.sent_at ?? '',
        },
        {
            key: 'error',
            header: t('dashboard.emailCampaigns.show.error'),
            cell: (recipient) =>
                recipient.error ? recipient.error.slice(0, 60) : '-',
            sortValue: (recipient) => recipient.error ?? '',
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.whatsappCampaigns.showTitle"
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                {
                    title: t('dashboard.whatsappCampaigns.title'),
                    href: campaigns.index.url(),
                },
            ]}
        >
            <div className="space-y-4 rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">
                        {campaign.mode === 'template'
                            ? t(
                                  'dashboard.whatsappCampaigns.table.templateLabel',
                                  { name: campaign.template_name },
                              )
                            : t('dashboard.whatsappCampaigns.table.freeText')}
                    </h2>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
                        {campaign.status === 'completed'
                            ? t('dashboard.emailCampaigns.show.completed')
                            : t('dashboard.emailCampaigns.show.sending')}
                    </span>
                </div>

                <p className="text-sm text-slate-500">
                    {t('dashboard.emailCampaigns.show.createdBy', {
                        name:
                            campaign.creator?.name ??
                            t('dashboard.emailCampaigns.show.unknown'),
                        date: formatDateTime(campaign.created_at),
                    })}
                </p>

                <div>
                    <div className="mb-1 flex justify-between text-sm">
                        <span>
                            {t('dashboard.emailCampaigns.show.sent', {
                                count: campaign.sent_count,
                            })}{' '}
                            ·{' '}
                            {t('dashboard.emailCampaigns.show.failed', {
                                count: campaign.failed_count,
                            })}{' '}
                            ·{' '}
                            {t('dashboard.emailCampaigns.show.pending', {
                                count: pending,
                            })}
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
                                {t(
                                    'dashboard.whatsappCampaigns.table.language',
                                )}{' '}
                                {campaign.template_language ?? '—'}
                            </p>
                            {campaign.template_variables &&
                                campaign.template_variables.length > 0 && (
                                    <p className="mt-1">
                                        {t(
                                            'dashboard.whatsappCampaigns.table.variables',
                                        )}{' '}
                                        {campaign.template_variables.join(', ')}
                                    </p>
                                )}
                        </>
                    ) : (
                        messageText
                    )}
                </div>

                {campaign.failed_count > 0 && (
                    <Form
                        {...campaigns.retry.form(campaign.id)}
                        className="w-fit"
                    >
                        <Button
                            type="submit"
                            variant="outline"
                            className="border-red-300 text-red-600"
                        >
                            {t('dashboard.emailCampaigns.show.retry', {
                                count: campaign.failed_count,
                            })}
                        </Button>
                    </Form>
                )}
            </div>

            <div className="rounded-xl border p-4">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">
                        {t('dashboard.emailCampaigns.show.recipients')}
                    </h3>
                    <Link
                        href={campaigns.create.url()}
                        className="text-sm text-blue-600 underline"
                    >
                        {t('dashboard.whatsappCampaigns.new')}
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
