import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, usePage } from '@inertiajs/react';

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

    const columns: DataTableColumn<Program>[] = [
        { key: 'id', header: '#', cell: (program) => program.id, sortValue: (program) => program.id },
        { key: 'name', header: 'Name', cell: (program) => program.name, sortValue: (program) => program.name },
        {
            key: 'type',
            header: 'Type',
            cell: (program) => program.program_type_label,
            sortValue: (program) => program.program_type_label,
        },
        {
            key: 'schedule',
            header: 'Schedule',
            cell: (program) => program.schedule,
            sortValue: (program) => program.schedule,
        },
        {
            key: 'fees',
            header: 'Fees',
            cell: (program) => program.fees,
            sortValue: (program) => Number(program.fees),
        },
        {
            key: 'enroll',
            header: 'Enroll',
            cell: (program) => (program.available_for_enroll ? 'Yes' : 'No'),
            sortValue: (program) => program.available_for_enroll,
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (program) => (
                <Link href={`/dashboard/programs/${program.id}/edit`} className="text-blue-600 underline">Edit</Link>
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

