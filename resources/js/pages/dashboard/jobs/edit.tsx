import DashboardPage from '@/components/dashboard/dashboard-page';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/form-fields';
import ConfirmDialog from '@/components/form/confirm-dialog';
import FormSection from '@/components/form/form-section';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { BriefcaseIcon, DocumentTextIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Form, router, usePage } from '@inertiajs/react';

interface Option {
    value: string;
    label: string;
}

interface JobDetail {
    id: number;
    title: string;
    department?: string | null;
    category?: string | null;
    description: string;
    requirements?: string | null;
    employment_type: string;
    working_hours?: string | null;
    application_email?: string | null;
    application_url?: string | null;
    deadline?: string | null;
    is_active: boolean;
}

interface Props {
    job: JobDetail;
    employmentTypes: Option[];
    categories: Option[];
    [key: string]: unknown;
}

export default function DashboardJobsEdit() {
    const { job, employmentTypes, categories } = usePage<Props>().props;
    const { onError } = useFormToast('Job updated successfully.');

    const removeJob = () => {
        router.delete(`/dashboard/jobs/${job.id}`, {
            onSuccess: () => router.visit('/dashboard/jobs'),
        });
    };

    return (
        <DashboardPage titleKey="dashboard.jobs.editTitle">
            <Form action={`/dashboard/jobs/${job.id}`} method="put" onError={onError}>
                {({ errors, processing }) => (
                    <div className="space-y-4">
                        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                            <div className="space-y-4">
                                <FormSection
                                    title="Job details"
                                    description="Update the title, department and description."
                                    icon={<DocumentTextIcon className="size-5" />}
                                    columns={2}
                                >
                                    <TextField
                                        label="Job title"
                                        name="title"
                                        required
                                        defaultValue={job.title}
                                        className="text-base md:col-span-2"
                                        error={errors.title}
                                    />
                                    <TextField
                                        label="Department"
                                        name="department"
                                        defaultValue={job.department ?? ''}
                                        error={errors.department}
                                    />
                                    <SelectField
                                        label="Program category"
                                        name="category"
                                        defaultValue={job.category ?? ''}
                                        options={categories}
                                        placeholder="Select a category (optional)"
                                        hint="Shown on the public card next to the department"
                                        error={errors.category}
                                    />
                                    <SelectField
                                        label="Employment type"
                                        name="employment_type"
                                        required
                                        defaultValue={job.employment_type}
                                        options={employmentTypes}
                                        error={errors.employment_type}
                                    />
                                    <TextField
                                        label="Working hours"
                                        name="working_hours"
                                        defaultValue={job.working_hours ?? ''}
                                        placeholder="e.g. 12:30 PM - 5:30 PM"
                                        hint="Displayed on the card for part-time roles"
                                        error={errors.working_hours}
                                    />
                                    <TextAreaField
                                        label="Description"
                                        name="description"
                                        required
                                        defaultValue={job.description}
                                        rows={6}
                                        className="md:col-span-2"
                                        error={errors.description}
                                    />
                                    <TextAreaField
                                        label="Requirements"
                                        name="requirements"
                                        defaultValue={job.requirements ?? ''}
                                        rows={4}
                                        className="md:col-span-2"
                                        error={errors.requirements}
                                    />
                                </FormSection>
                            </div>

                            <aside className="space-y-4">
                                <FormSection
                                    title="Application"
                                    icon={<EnvelopeIcon className="size-5" />}
                                >
                                    <TextField
                                        label="Application email"
                                        name="application_email"
                                        type="email"
                                        defaultValue={job.application_email ?? ''}
                                        hint="Shown as a button on the public listing"
                                        error={errors.application_email}
                                    />
                                    <TextField
                                        label="Application URL"
                                        name="application_url"
                                        type="text"
                                        defaultValue={job.application_url ?? ''}
                                        hint="External form link (optional)"
                                        error={errors.application_url}
                                    />
                                </FormSection>

                                <FormSection
                                    title="Settings"
                                    icon={<BriefcaseIcon className="size-5" />}
                                >
                                    <TextField
                                        label="Deadline"
                                        name="deadline"
                                        type="date"
                                        defaultValue={job.deadline ?? ''}
                                        hint="Job auto-hides after this date"
                                        error={errors.deadline}
                                    />
                                    <CheckboxField
                                        label="Active"
                                        name="is_active"
                                        value="1"
                                        defaultChecked={job.is_active}
                                    />
                                </FormSection>
                            </aside>
                        </div>

                        <StickyFormFooter
                            submitLabel="Update job"
                            processing={processing}
                            cancelHref="/dashboard/jobs"
                        >
                            <ConfirmDialog
                                title="Delete job?"
                                description={
                                    <>
                                        Delete &ldquo;{job.title}&rdquo;? This cannot be undone.
                                    </>
                                }
                                confirmLabel="Delete"
                                onConfirm={removeJob}
                            >
                                <Button type="button" variant="destructive">
                                    Delete job
                                </Button>
                            </ConfirmDialog>
                        </StickyFormFooter>
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
