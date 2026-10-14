import DashboardPage from '@/components/dashboard/dashboard-page';
import JobForm, {
    type JobDetail,
    type JobOption,
    type TranslationValues,
} from '@/components/dashboard/jobs/job-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface JobEditProps {
    job: JobDetail;
    translations: TranslationValues;
    employmentTypes: JobOption[];
    categories: JobOption[];
    [key: string]: unknown;
}

export default function DashboardJobsEdit() {
    const { job, translations, employmentTypes, categories } =
        usePage<JobEditProps>().props;
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
                translations={translations}
                deleteUrl={`/dashboard/jobs/${job.id}`}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
