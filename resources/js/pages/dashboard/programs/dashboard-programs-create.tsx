import DashboardPage from '@/components/dashboard/dashboard-page';
import ProgramForm from '@/components/dashboard/programs/program-form';
import { useFormToast } from '@/components/feedback/use-form-toast';
import programs from '@/routes/dashboard/programs';
import { useTranslation } from 'react-i18next';

export default function DashboardProgramsCreate() {
    const { t } = useTranslation();
    const { onError } = useFormToast(t('dashboard.programs.created'));

    return (
        <DashboardPage titleKey="dashboard.programs.createTitle">
            <ProgramForm
                formProps={programs.store.form()}
                submitLabel={t('dashboard.form.save')}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
