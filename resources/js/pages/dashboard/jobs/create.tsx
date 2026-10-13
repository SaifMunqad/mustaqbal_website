import DashboardPage from '@/components/dashboard/dashboard-page';
import JobForm, { type JobOption } from '@/components/dashboard/jobs/job-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface JobCreateProps {
    employmentTypes: JobOption[];
    categories: JobOption[];
    [key: string]: unknown;
}

export default function DashboardJobsCreate() {
    const { employmentTypes, categories } = usePage<JobCreateProps>().props;
    const { onError } = useFormToast('Job created successfully.');

    return (
        <DashboardPage titleKey="dashboard.jobs.createTitle">
            <JobForm
                action="/dashboard/jobs"
                method="post"
                submitLabel="Save job"
                cancelHref="/dashboard/jobs"
                employmentTypes={employmentTypes}
                categories={categories}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
