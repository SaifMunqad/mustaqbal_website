/**
 * Bulk WhatsApp campaign listing.
 *
 * When the API credentials are missing the page shows a warning pointing at the
 * WhatsApp settings screen instead of letting the admin start a campaign that
 * cannot send.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import campaigns from '@/routes/dashboard/whatsapp-campaigns';
import settings from '@/routes/dashboard/whatsapp-settings';
import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Campaign {
    id: number;
    mode: string;
    template_name?: string | null;
    message?: string | null;
    recipient_source: string;
    total_count: number;
    sent_count: number;
    failed_count: number;
    status: string;
    created_at: string;
    creator?: { name: string } | null;
}

export default function DashboardWhatsAppCampaignsIndex() {
    const { t } = useTranslation();
    // Follows the browser-stored calendar preference (Afghan Solar Hijri default).
    const formatDate = useDateFormatter();
    const { campaigns: pageCampaigns, configured } = usePage<{
        campaigns: { data: Campaign[] };
        configured: boolean;
    }>().props;

    const columns: DataTableColumn<Campaign>[] = [
        {
            key: 'id',
            header: '#',
            cell: (campaign) => campaign.id,
            sortValue: (campaign) => campaign.id,
        },
        {
            key: 'content',
            header: t('dashboard.whatsappCampaigns.table.message'),
            cell: (campaign) => (
                <Link
                    href={campaigns.show.url(campaign.id)}
                    className="text-blue-600 underline"
                >
                    {campaign.mode === 'template'
                        ? t('dashboard.whatsappCampaigns.table.templateLabel', {
                              name: campaign.template_name,
                          })
                        : (campaign.message ?? '').slice(0, 48)}
                </Link>
            ),
            sortValue: (campaign) =>
                campaign.template_name ?? campaign.message ?? '',
        },
        {
            key: 'mode',
            header: t('dashboard.table.type'),
            cell: (campaign) =>
                campaign.mode === 'template'
                    ? t('dashboard.whatsappCampaigns.table.template')
                    : t('dashboard.whatsappCampaigns.table.freeText'),
            sortValue: (campaign) => campaign.mode,
        },
        {
            key: 'recipient_source',
            header: t('dashboard.whatsappCampaigns.table.recipients'),
            cell: (campaign) =>
                campaign.recipient_source === 'contacts'
                    ? t('dashboard.whatsappCampaigns.table.contactNumbers')
                    : t('dashboard.whatsappCampaigns.table.customList'),
            sortValue: (campaign) => campaign.recipient_source,
        },
        {
            key: 'progress',
            header: t('dashboard.whatsappCampaigns.table.progress'),
            cell: (campaign) =>
                t('dashboard.whatsappCampaigns.table.progressValue', {
                    sent: campaign.sent_count,
                    total: campaign.total_count,
                }),
            sortValue: (campaign) => campaign.sent_count,
        },
        {
            key: 'failed_count',
            header: t('dashboard.whatsappCampaigns.table.failed'),
            cell: (campaign) => campaign.failed_count,
            sortValue: (campaign) => campaign.failed_count,
        },
        {
            key: 'status',
            header: t('dashboard.whatsappCampaigns.table.status'),
            cell: (campaign) =>
                campaign.status === 'completed'
                    ? t('enums.whatsappCampaignStatus.completed')
                    : t('enums.whatsappCampaignStatus.queued'),
            sortValue: (campaign) => campaign.status,
        },
        {
            key: 'created_at',
            header: t('dashboard.whatsappCampaigns.table.created'),
            cell: (campaign) => formatDate(campaign.created_at),
            sortValue: (campaign) => campaign.created_at,
        },
        {
            key: 'creator',
            header: t('dashboard.whatsappCampaigns.table.sentBy'),
            cell: (campaign) => campaign.creator?.name ?? '-',
            sortValue: (campaign) => campaign.creator?.name ?? '',
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.whatsappCampaigns.title"
            createHref={campaigns.create.url()}
            createLabelKey="dashboard.whatsappCampaigns.new"
            actions={
                <Button asChild size="sm" variant="outline">
                    <Link href={settings.edit.url()}>
                        {t('dashboard.whatsappCampaigns.apiSettings')}
                    </Link>
                </Button>
            }
        >
            {!configured && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="size-5" />
                        <span className="text-sm font-medium">
                            {t(
                                'dashboard.whatsappCampaigns.notConfiguredBanner',
                            )}
                        </span>
                    </div>
                    <Link
                        href={settings.edit.url()}
                        className="text-sm font-semibold underline"
                    >
                        {t('dashboard.whatsappCampaigns.configureNow')}
                    </Link>
                </div>
            )}

            <DataTable
                data={pageCampaigns.data}
                columns={columns}
                rowKey={(campaign) => campaign.id}
                defaultSort={{ key: 'id', direction: 'desc' }}
            />
        </DashboardPage>
    );
}
