import DashboardPage from '@/components/dashboard/dashboard-page';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { useFormToast } from '@/components/use-form-toast';
import { BriefcaseIcon, DocumentTextIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Form, usePage } from '@inertiajs/react';

interface JobOption {
    value: string;
    label: string;
}

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
            <Form action="/dashboard/jobs" method="post" onError={onError}>
                {({ errors, processing }) => (
                    <div className="space-y-4">
                        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                            <div className="space-y-4">
                                <FormSection
                                    title="Job details"
                                    description="Add a title, department and a detailed description for the position."
                                    icon={<DocumentTextIcon className="size-5" />}
                                    columns={2}
                                >
                                    <TextField
                                        label="Job title"
                                        name="title"
                                        required
                                        placeholder="e.g. Mathematics Teacher"
                                        className="text-base md:col-span-2"
                                        error={errors.title}
                                    />
                                    <TextField
                                        label="Department"
                                        name="department"
                                        placeholder="e.g. Academic, Administration"
                                        error={errors.department}
                                    />
                                    <SelectField
                                        label="Program category"
                                        name="category"
                                        options={categories}
                                        placeholder="Select a category (optional)"
                                        hint="Shown on the public card next to the department"
                                        error={errors.category}
                                    />
                                    <SelectField
                                        label="Employment type"
                                        name="employment_type"
                                        required
                                        defaultValue="full_time"
                                        options={employmentTypes}
                                        error={errors.employment_type}
                                    />
                                    <TextField
                                        label="Working hours"
                                        name="working_hours"
                                        placeholder="e.g. 12:30 PM - 5:30 PM"
                                        hint="Displayed on the card for part-time roles"
                                        error={errors.working_hours}
                                    />
                                    <TextAreaField
                                        label="Description"
                                        name="description"
                                        required
                                        placeholder="Describe the role, responsibilities, and work environment..."
                                        rows={6}
                                        className="md:col-span-2"
                                        error={errors.description}
                                    />
                                    <TextAreaField
                                        label="Requirements"
                                        name="requirements"
                                        placeholder="Qualifications, experience, skills needed..."
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
                                        placeholder="hr@school.com"
                                        hint="Shown as a button on the public listing"
                                        error={errors.application_email}
                                    />
                                    <TextField
                                        label="Application URL"
                                        name="application_url"
                                        type="text"
                                        placeholder="https://forms.google.com/..."
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
                                        hint="Job auto-hides after this date"
                                        error={errors.deadline}
                                    />
                                    <CheckboxField
                                        label="Active"
                                        name="is_active"
                                        value="1"
                                        defaultChecked
                                    />
                                </FormSection>
                            </aside>
                        </div>

                        <StickyFormFooter
                            submitLabel="Save job"
                            processing={processing}
                            cancelHref="/dashboard/jobs"
                        />
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
