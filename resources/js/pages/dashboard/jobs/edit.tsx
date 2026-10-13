import DashboardPage from '@/components/dashboard/dashboard-page';
import JobForm, {
    type JobDetail,
    type JobOption,
} from '@/components/dashboard/jobs/job-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface JobEditProps {
    job: JobDetail;
    employmentTypes: JobOption[];
    categories: JobOption[];
    [key: string]: unknown;
}

export default function DashboardJobsEdit() {
    const { job, employmentTypes, categories } = usePage<JobEditProps>().props;
    const { onError } = useFormToast('Job updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.jobs.editTitle">
            <JobForm
                action={`/dashboard/jobs/${job.id}`}
                method="put"
                submitLabel="Update job"
                cancelHref="/dashboard/jobs"
                employmentTypes={employmentTypes}
                categories={categories}
                job={job}
                deleteUrl={`/dashboard/jobs/${job.id}`}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
