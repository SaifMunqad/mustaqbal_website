import AwardForm from '@/components/dashboard/awards/award-form';
import DashboardPage from '@/components/dashboard/dashboard-page';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { useTranslation } from 'react-i18next';

export default function DashboardAwardsCreate() {
    const { t } = useTranslation();
    const { onError } = useFormToast(t('dashboard.awards.created'));

    return (
        <DashboardPage titleKey="dashboard.awards.createTitle">
            <AwardForm
                action="/dashboard/awards"
                method="post"
                submitLabel={t('dashboard.awards.form.save')}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
