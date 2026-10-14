import {
    BriefcaseIcon,
    DocumentTextIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Form, router } from '@inertiajs/react';
import { CheckboxField, SelectField, TextField } from '@/components/form-fields';
import ConfirmDialog from '@/components/form/confirm-dialog';
import FormSection from '@/components/form/form-section';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/language-tabs-editor';
import { Button } from '@/components/ui/button';

export type { TranslationValues } from '@/components/language-tabs-editor';

export interface JobOption {
    value: string;
    label: string;
}

export interface JobDetail {
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

interface JobFormProps {
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
    cancelHref: string;
    employmentTypes: JobOption[];
    categories: JobOption[];
    toastOnError: (errors: Record<string, string>) => void;
    // Present on edit; absent on create so fields render empty.
    job?: JobDetail;
    // Existing per-language content, seeded into the localized editor on edit.
    translations?: TranslationValues;
    // When set (edit), a destructive delete action is shown in the footer.
    deleteUrl?: string;
}

// Localized inputs rendered once per active language (default language required).
const translatableFields: TranslatableField[] = [
    { name: 'title', label: 'Job title', type: 'text', placeholder: 'e.g. Mathematics Teacher', maxLength: 255 },
    { name: 'department', label: 'Department', type: 'text', placeholder: 'e.g. Academic, Administration', required: false },
    {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe the role, responsibilities, and work environment...',
        rows: 6,
    },
    {
        name: 'requirements',
        label: 'Requirements',
        type: 'textarea',
        placeholder: 'Qualifications, experience, skills needed...',
        rows: 4,
        required: false,
    },
];

/**
 * Shared create/edit form for job postings. Renders identical markup for both
 * modes; create passes no `job` so the fields fall back to empty placeholders,
 * while edit supplies the record (and a `deleteUrl`) via defaults.
 */
export default function JobForm({
    action,
    method,
    submitLabel,
    cancelHref,
    employmentTypes,
    categories,
    toastOnError,
    job,
    translations,
    deleteUrl,
}: JobFormProps) {
    const removeJob = () => {
        if (!job) {
            return;
        }
        router.delete(`${deleteUrl}`, {
            onSuccess: () => router.visit('/dashboard/jobs'),
        });
    };

    return (
        <Form action={action} method={method} onError={toastOnError}>
            {({ errors, processing }) => (
                <div className="space-y-4">
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                        <div className="space-y-4">
                            <FormSection
                                title="Job details"
                                description="Set the program category, employment type and working hours (shared across languages)."
                                icon={<BriefcaseIcon className="size-5" />}
                                columns={2}
                            >
                                <SelectField
                                    label="Program category"
                                    name="category"
                                    defaultValue={job?.category ?? ''}
                                    options={categories}
                                    placeholder="Select a category (optional)"
                                    hint="Shown on the public card next to the department"
                                    error={errors.category}
                                />
                                <SelectField
                                    label="Employment type"
                                    name="employment_type"
                                    required
                                    defaultValue={job?.employment_type ?? 'full_time'}
                                    options={employmentTypes}
                                    error={errors.employment_type}
                                />
                                <TextField
                                    label="Working hours"
                                    name="working_hours"
                                    defaultValue={job?.working_hours ?? ''}
                                    placeholder="e.g. 12:30 PM - 5:30 PM"
                                    hint="Displayed on the card for part-time roles"
                                    error={errors.working_hours}
                                />
                            </FormSection>

                            <FormSection
                                title="Localized content"
                                description="Add the title, department, description and requirements for each language. The starred language is required and used as the fallback."
                                icon={<DocumentTextIcon className="size-5" />}
                            >
                                <LanguageTabsEditor
                                    fields={translatableFields}
                                    translations={translations}
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
                                    defaultValue={job?.application_email ?? ''}
                                    placeholder="hr@school.com"
                                    hint="Shown as a button on the public listing"
                                    error={errors.application_email}
                                />
                                <TextField
                                    label="Application URL"
                                    name="application_url"
                                    type="text"
                                    defaultValue={job?.application_url ?? ''}
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
                                    defaultValue={job?.deadline ?? ''}
                                    hint="Job auto-hides after this date"
                                    error={errors.deadline}
                                />
                                <CheckboxField
                                    label="Active"
                                    name="is_active"
                                    value="1"
                                    defaultChecked={job ? job.is_active : true}
                                />
                            </FormSection>
                        </aside>
                    </div>

                    <StickyFormFooter
                        submitLabel={submitLabel}
                        processing={processing}
                        cancelHref={cancelHref}
                    >
                        {deleteUrl && job ? (
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
                        ) : null}
                    </StickyFormFooter>
                </div>
            )}
        </Form>
    );
}
