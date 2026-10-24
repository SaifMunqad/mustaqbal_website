/**
 * Bulk email campaign listing. Row links open the campaign detail, which is where
 * delivery status is tracked.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import campaigns from '@/routes/dashboard/email-campaigns';
import { Link, usePage } from '@inertiajs/react';

interface Campaign {
    id: number;
    subject: string;
    recipient_source: string;
    total_count: number;
    sent_count: number;
    failed_count: number;
    status: string;
    created_at: string;
    creator?: { name: string } | null;
}

const sourceLabels: Record<string, string> = {
    users: 'Active users',
    contacts: 'Contacts',
    users_contacts: 'Users + contacts',
    custom: 'Custom list',
};

export default function DashboardEmailCampaignsIndex() {
    const { campaigns: pageCampaigns } = usePage<{ campaigns: { data: Campaign[] } }>().props;

    const columns: DataTableColumn<Campaign>[] = [
        { key: 'id', header: '#', cell: (campaign) => campaign.id, sortValue: (campaign) => campaign.id },
        {
            key: 'subject',
            header: 'Subject',
            cell: (campaign) => (
                <Link href={campaigns.show.url(campaign.id)} className="text-blue-600 underline">
                    {campaign.subject}
                </Link>
            ),
            sortValue: (campaign) => campaign.subject,
        },
        {
            key: 'recipient_source',
            header: 'Recipients',
            cell: (campaign) => sourceLabels[campaign.recipient_source] ?? campaign.recipient_source,
            sortValue: (campaign) => campaign.recipient_source,
        },
        {
            key: 'progress',
            header: 'Progress',
            cell: (campaign) => `${campaign.sent_count}/${campaign.total_count} sent`,
            sortValue: (campaign) => campaign.sent_count,
        },
        {
            key: 'failed_count',
            header: 'Failed',
            cell: (campaign) => campaign.failed_count,
            sortValue: (campaign) => campaign.failed_count,
        },
        {
            key: 'status',
            header: 'Status',
            cell: (campaign) => (campaign.status === 'completed' ? 'Completed' : 'Sending'),
            sortValue: (campaign) => campaign.status,
        },
        {
            key: 'created_at',
            header: 'Created',
            cell: (campaign) => new Date(campaign.created_at).toLocaleDateString(),
            sortValue: (campaign) => campaign.created_at,
        },
        {
            key: 'creator',
            header: 'Sent by',
            cell: (campaign) => campaign.creator?.name ?? '-',
            sortValue: (campaign) => campaign.creator?.name ?? '',
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.emailCampaigns.title"
            createHref={campaigns.create.url()}
            createLabelKey="dashboard.emailCampaigns.new"
        >
            <DataTable
                data={pageCampaigns.data}
                columns={columns}
                rowKey={(campaign) => campaign.id}
                defaultSort={{ key: 'id', direction: 'desc' }}
            />
        </DashboardPage>
    );
}
