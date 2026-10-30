import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/editor/language-tabs-editor';
import ConfirmDialog from '@/components/form/confirm-dialog';
import {
    CheckboxField,
    DateField,
    SelectField,
    TextField,
} from '@/components/form/form-fields';
import FormSection from '@/components/form/form-section';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { Button } from '@/components/ui/button';
import {
    BriefcaseIcon,
    DocumentTextIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Form, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export type { TranslationValues } from '@/components/editor/language-tabs-editor';

export interface JobOption {
    value: string;
    label: string;
    labelKey?: string;
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

// Localized inputs are built inside the component so their labels follow the
// active UI language.

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
    const { t } = useTranslation();

    const employmentTypeOptions = employmentTypes.map((option) => ({
        ...option,
        labelKey: `jobs.employmentType.${option.value}`,
    }));
    const categoryOptions = categories.map((option) => ({
        ...option,
        labelKey: option.value
            ? `jobs.category.${option.value}`
            : 'dashboard.jobs.form.noCategory',
    }));

    const translatableFields: TranslatableField[] = [
        {
            name: 'title',
            label: t('dashboard.jobs.form.title'),
            type: 'text',
            placeholder: t('dashboard.jobs.form.titlePlaceholder'),
            maxLength: 255,
        },
        {
            name: 'department',
            label: t('dashboard.jobs.form.department'),
            type: 'text',
            placeholder: t('dashboard.jobs.form.departmentPlaceholder'),
            required: false,
        },
        {
            name: 'description',
            label: t('dashboard.jobs.form.description'),
            type: 'textarea',
            placeholder: t('dashboard.jobs.form.descriptionPlaceholder'),
            rows: 6,
        },
        {
            name: 'requirements',
            label: t('dashboard.jobs.form.requirements'),
            type: 'textarea',
            placeholder: t('dashboard.jobs.form.requirementsPlaceholder'),
            rows: 4,
            required: false,
        },
    ];

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
                                title={t('dashboard.jobs.form.details')}
                                description={t(
                                    'dashboard.jobs.form.detailsDescription',
                                )}
                                icon={<BriefcaseIcon className="size-5" />}
                                columns={2}
                            >
                                <SelectField
                                    label={t('dashboard.jobs.form.category')}
                                    name="category"
                                    defaultValue={job?.category ?? ''}
                                    options={categoryOptions}
                                    placeholder={t(
                                        'dashboard.jobs.form.categoryPlaceholder',
                                    )}
                                    hint={t('dashboard.jobs.form.categoryHint')}
                                    error={errors.category}
                                />
                                <SelectField
                                    label={t(
                                        'dashboard.jobs.form.employmentType',
                                    )}
                                    name="employment_type"
                                    required
                                    defaultValue={
                                        job?.employment_type ?? 'full_time'
                                    }
                                    options={employmentTypeOptions}
                                    error={errors.employment_type}
                                />
                                <TextField
                                    label={t(
                                        'dashboard.jobs.form.workingHours',
                                    )}
                                    name="working_hours"
                                    defaultValue={job?.working_hours ?? ''}
                                    placeholder={t(
                                        'dashboard.jobs.form.workingHoursPlaceholder',
                                    )}
                                    hint={t(
                                        'dashboard.jobs.form.workingHoursHint',
                                    )}
                                    error={errors.working_hours}
                                />
                            </FormSection>

                            <FormSection
                                title={t('dashboard.jobs.form.localized')}
                                description={t(
                                    'dashboard.jobs.form.localizedDescription',
                                )}
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
                                title={t('dashboard.jobs.form.application')}
                                icon={<EnvelopeIcon className="size-5" />}
                            >
                                <TextField
                                    label={t(
                                        'dashboard.jobs.form.applicationEmail',
                                    )}
                                    name="application_email"
                                    type="email"
                                    defaultValue={job?.application_email ?? ''}
                                    placeholder={t(
                                        'dashboard.jobs.form.applicationEmailPlaceholder',
                                    )}
                                    hint={t(
                                        'dashboard.jobs.form.applicationEmailHint',
                                    )}
                                    error={errors.application_email}
                                />
                                <TextField
                                    label={t(
                                        'dashboard.jobs.form.applicationUrl',
                                    )}
                                    name="application_url"
                                    type="text"
                                    defaultValue={job?.application_url ?? ''}
                                    placeholder={t(
                                        'dashboard.jobs.form.applicationUrlPlaceholder',
                                    )}
                                    hint={t(
                                        'dashboard.jobs.form.applicationUrlHint',
                                    )}
                                    error={errors.application_url}
                                />
                            </FormSection>

                            <FormSection
                                title={t('dashboard.jobs.form.settings')}
                                icon={<BriefcaseIcon className="size-5" />}
                            >
                                <DateField
                                    label={t('dashboard.jobs.form.deadline')}
                                    name="deadline"
                                    defaultValue={job?.deadline ?? ''}
                                    hint={t('dashboard.jobs.form.deadlineHint')}
                                    error={errors.deadline}
                                />
                                <CheckboxField
                                    label={t('dashboard.jobs.form.active')}
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
                                title={t('dashboard.jobs.form.deleteTitle')}
                                description={t(
                                    'dashboard.jobs.form.deleteDescription',
                                    { name: job.title },
                                )}
                                confirmLabel={t('dashboard.form.delete')}
                                onConfirm={removeJob}
                            >
                                <Button type="button" variant="destructive">
                                    {t('dashboard.jobs.form.delete')}
                                </Button>
                            </ConfirmDialog>
                        ) : null}
                    </StickyFormFooter>
                </div>
            )}
        </Form>
    );
}
