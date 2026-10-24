import DashboardPage from '@/components/dashboard/dashboard-page';
import JobForm, { type JobOption } from '@/components/dashboard/jobs/job-form';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface JobCreateProps {
    employmentTypes: JobOption[];
    categories: JobOption[];
    [key: string]: unknown;
}

export default function DashboardJobsCreate() {
    const { t } = useTranslation();
    const { employmentTypes, categories } = usePage<JobCreateProps>().props;
    const { onError } = useFormToast(t('dashboard.jobs.created'));

    return (
        <DashboardPage titleKey="dashboard.jobs.createTitle">
            <JobForm
                action="/dashboard/jobs"
                method="post"
                submitLabel={t('dashboard.jobs.form.save')}
                cancelHref="/dashboard/jobs"
                employmentTypes={employmentTypes}
                categories={categories}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
