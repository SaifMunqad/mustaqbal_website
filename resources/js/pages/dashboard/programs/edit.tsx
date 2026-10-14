import DashboardPage from '@/components/dashboard/dashboard-page';
import ProgramForm, {
    type Program,
    type TranslationValues,
} from '@/components/dashboard/programs/program-form';
import { useFormToast } from '@/components/use-form-toast';
import programs from '@/routes/dashboard/programs';
import { usePage } from '@inertiajs/react';

export default function DashboardProgramsEdit() {
    const { program, translations } = usePage<{
        program: Program;
        translations?: TranslationValues;
    }>().props;
    const { onError } = useFormToast('Program updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.programs.editTitle">
            <ProgramForm
                formProps={programs.update.form(program.id)}
                submitLabel="Update"
                program={program}
                translations={translations}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
