import AwardForm, { type AwardRecord } from '@/components/dashboard/awards/award-form';
import DashboardPage from '@/components/dashboard/dashboard-page';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface AwardEditProps {
    award: AwardRecord;
    [key: string]: unknown;
}

export default function DashboardAwardsEdit() {
    const { t } = useTranslation();
    const { award } = usePage<AwardEditProps>().props;
    const { onError } = useFormToast(t('dashboard.awards.updated'));

    return (
        <DashboardPage titleKey="dashboard.awards.editTitle">
            <AwardForm
                action={`/dashboard/awards/${award.id}`}
                method="put"
                submitLabel={t('dashboard.awards.form.update')}
                award={award}
                deleteUrl={`/dashboard/awards/${award.id}`}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
