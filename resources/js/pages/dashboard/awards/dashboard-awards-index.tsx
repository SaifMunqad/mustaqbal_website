/**
 * Award listing with the shared search/filter toolbar.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import ResourceFilterBar from '@/components/dashboard/resource-filter-bar';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AwardRow {
    id: number;
    person_id: string;
    award_id: string;
    full_name: string;
    father_name?: string | null;
    awarded_at?: string | null;
}

interface AwardsIndexProps {
    awards: { data: AwardRow[] };
    filters: { search: string };
    [key: string]: unknown;
}

export default function DashboardAwardsIndex() {
    const { awards, filters } = usePage<AwardsIndexProps>().props;
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;
    const [search, setSearch] = useState(filters.search);

    const formatDate = (value?: string | null) => {
        if (!value) {
            return '-';
        }

        try {
            return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
        } catch {
            return value;
        }
    };

    const columns: DataTableColumn<AwardRow>[] = [
        { key: 'person_id', header: t('dashboard.table.personId'), cell: (row) => row.person_id, sortValue: (row) => row.person_id },
        { key: 'award_id', header: t('dashboard.table.awardId'), cell: (row) => row.award_id, sortValue: (row) => row.award_id },
        { key: 'full_name', header: t('dashboard.table.fullName'), cell: (row) => row.full_name, sortValue: (row) => row.full_name },
        {
            key: 'father_name',
            header: t('dashboard.table.fatherName'),
            cell: (row) => row.father_name ?? '-',
            sortValue: (row) => row.father_name ?? '',
        },
        {
            key: 'awarded_at',
            header: t('dashboard.table.awardedAt'),
            cell: (row) => formatDate(row.awarded_at),
            sortValue: (row) => row.awarded_at ?? '',
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (row) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/awards/${row.id}/edit`} className="text-blue-600 underline">
                        {t('dashboard.table.edit')}
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.awards.title"
            createHref="/dashboard/awards/create"
            createLabelKey="dashboard.actions.newAward"
            actions={
                <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/awards/import">{t('dashboard.awards.importTitle')}</Link>
                </Button>
            }
        >
            <ResourceFilterBar
                search={search}
                onSearchChange={setSearch}
                onApply={() => router.get('/dashboard/awards', { search }, { preserveState: true, replace: true })}
                placeholder={t('dashboard.table.searchAwards')}
            />

            <DataTable
                data={awards.data}
                columns={columns}
                rowKey={(row) => row.id}
                defaultSort={{ key: 'awarded_at', direction: 'desc' }}
            />
        </DashboardPage>
    );
}
