import DashboardPage from '@/components/dashboard/dashboard-page';
import ProgramForm, { type Program } from '@/components/dashboard/programs/program-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import programs from '@/routes/dashboard/programs';

export default function DashboardProgramsEdit() {
    const { program } = usePage<{ program: Program }>().props;
    const { onError } = useFormToast('Program updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.programs.editTitle">
            <ProgramForm
                formProps={programs.update.form(program.id)}
                submitLabel="Update"
                program={program}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
