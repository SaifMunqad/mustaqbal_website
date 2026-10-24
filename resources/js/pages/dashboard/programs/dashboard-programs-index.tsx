/**
 * Programme listing.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface Program {
    id: number;
    name: string;
    program_type: string;
    program_type_label: string;
    schedule: string;
    fees: string;
    available_for_enroll: boolean;
}

export default function DashboardProgramsIndex() {
    const { programs } = usePage<{ programs: { data: Program[] } }>().props;
    const { t } = useTranslation();

    const columns: DataTableColumn<Program>[] = [
        { key: 'id', header: '#', cell: (program) => program.id, sortValue: (program) => program.id },
        { key: 'name', header: t('dashboard.table.name'), cell: (program) => program.name, sortValue: (program) => program.name },
        {
            key: 'type',
            header: t('dashboard.table.type'),
            cell: (program) => program.program_type_label,
            sortValue: (program) => program.program_type_label,
        },
        {
            key: 'schedule',
            header: t('dashboard.table.schedule'),
            cell: (program) => program.schedule,
            sortValue: (program) => program.schedule,
        },
        {
            key: 'fees',
            header: t('dashboard.table.fees'),
            cell: (program) => program.fees,
            sortValue: (program) => Number(program.fees),
        },
        {
            key: 'enroll',
            header: t('dashboard.table.enroll'),
            cell: (program) =>
                program.available_for_enroll
                    ? t('dashboard.table.yes')
                    : t('dashboard.table.no'),
            sortValue: (program) => program.available_for_enroll,
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (program) => (
                <Link href={`/dashboard/programs/${program.id}/edit`} className="text-blue-600 underline">{t('dashboard.table.edit')}</Link>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.programs.title"
            createHref="/dashboard/programs/create"
            createLabelKey="dashboard.actions.newProgram"
        >
            <DataTable
                data={programs.data}
                columns={columns}
                rowKey={(program) => program.id}
                defaultSort={{ key: 'id', direction: 'asc' }}
            />
        </DashboardPage>
    );
}

