import DashboardPage from '@/components/dashboard/dashboard-page';
import ProgramForm from '@/components/dashboard/programs/program-form';
import { useFormToast } from '@/components/use-form-toast';
import programs from '@/routes/dashboard/programs';

export default function DashboardProgramsCreate() {
    const { onError } = useFormToast('Program created successfully.');

    return (
        <DashboardPage titleKey="dashboard.programs.createTitle">
            <ProgramForm
                formProps={programs.store.form()}
                submitLabel="Save"
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
