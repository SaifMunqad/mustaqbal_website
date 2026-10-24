/**
 * Edit screen for a programme.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import ProgramForm, {
    type Program,
    type TranslationValues,
} from '@/components/dashboard/programs/program-form';
import { useFormToast } from '@/components/feedback/use-form-toast';
import programs from '@/routes/dashboard/programs';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function DashboardProgramsEdit() {
    const { t } = useTranslation();
    const { program, translations } = usePage<{
        program: Program;
        translations?: TranslationValues;
    }>().props;
    const { onError } = useFormToast(t('dashboard.programs.updated'));

    return (
        <DashboardPage titleKey="dashboard.programs.editTitle">
            <ProgramForm
                formProps={programs.update.form(program.id)}
                submitLabel={t('dashboard.form.save')}
                program={program}
                translations={translations}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
