import {
    CheckboxField,
    SelectField,
    TextField,
} from '@/components/form-fields';
import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/language-tabs-editor';
import { Button } from '@/components/ui/button';
import { Form } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export type { TranslationValues } from '@/components/language-tabs-editor';

export interface Program {
    id: number;
    program_type: string;
    fees: string;
    display_order: number;
    available_for_enroll: boolean;
}

const programTypeOptions = [
    { value: 'school', labelKey: 'dashboard.programs.form.school' },
    { value: 'courses', labelKey: 'dashboard.programs.form.courses' },
    {
        value: 'islamic_madrasa',
        labelKey: 'dashboard.programs.form.islamicMadrasa',
    },
];

// Localized inputs are built inside the component so their labels follow the
// active UI language.
interface ProgramFormProps {
    // Inertia route target, e.g. programs.store.form() / programs.update.form(id).
    formProps: { action: string; method: 'post' | 'put' | 'patch' };
    submitLabel: string;
    toastOnError: (errors: Record<string, string>) => void;
    // Present on edit; absent on create so fields render empty.
    program?: Program;
    // Existing per-language content, seeded into the localized editor on edit.
    translations?: TranslationValues;
}

/**
 * Shared create/edit form for programs. Language-agnostic settings (type, fees,
 * order, availability) are plain inputs; every user-facing text lives in the
 * per-language editor and is submitted as a `translations.{code}.{field}` payload.
 */
export default function ProgramForm({
    formProps,
    submitLabel,
    toastOnError,
    program,
    translations,
}: ProgramFormProps) {
    const { t } = useTranslation();

    const translatableFields: TranslatableField[] = [
        {
            name: 'name',
            label: t('dashboard.programs.form.name'),
            type: 'text',
            placeholder: t('dashboard.programs.form.namePlaceholder'),
            maxLength: 255,
        },
        {
            name: 'description',
            label: t('dashboard.programs.form.description'),
            type: 'textarea',
            placeholder: t('dashboard.programs.form.descriptionPlaceholder'),
            rows: 5,
        },
        {
            name: 'schedule',
            label: t('dashboard.programs.form.schedule'),
            type: 'text',
            placeholder: t('dashboard.programs.form.schedulePlaceholder'),
            maxLength: 255,
        },
        {
            name: 'age_recommendation',
            label: t('dashboard.programs.form.age'),
            type: 'text',
            placeholder: t('dashboard.programs.form.agePlaceholder'),
            maxLength: 255,
        },
        {
            name: 'classroom_number',
            label: t('dashboard.programs.form.classroom'),
            type: 'text',
            placeholder: t('dashboard.programs.form.classroomPlaceholder'),
            required: false,
            maxLength: 100,
        },
    ];

    return (
        <Form {...formProps} onError={toastOnError} className="space-y-4">
            <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-2">
                <SelectField
                    label={t('dashboard.programs.form.type')}
                    name="program_type"
                    required
                    defaultValue={program?.program_type ?? 'school'}
                    options={programTypeOptions}
                />
                <TextField
                    label={t('dashboard.programs.form.fees')}
                    name="fees"
                    required
                    type="number"
                    step="0.01"
                    defaultValue={program?.fees ?? ''}
                    placeholder={t('dashboard.programs.form.feesPlaceholder')}
                />
                <TextField
                    label={t('dashboard.programs.form.displayOrder')}
                    name="display_order"
                    type="number"
                    defaultValue={program?.display_order ?? ''}
                    placeholder={t(
                        'dashboard.programs.form.displayOrderPlaceholder',
                    )}
                />
                <CheckboxField
                    label={t('dashboard.programs.form.availableForEnroll')}
                    name="available_for_enroll"
                    value="1"
                    defaultChecked={
                        program ? program.available_for_enroll : true
                    }
                />
            </div>

            <div className="space-y-3 rounded-xl border p-4">
                <div>
                    <h2 className="text-sm font-semibold">
                        {t('dashboard.programs.form.localized')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {t('dashboard.programs.form.localizedDescription')}
                    </p>
                </div>
                <LanguageTabsEditor
                    fields={translatableFields}
                    translations={translations}
                />
            </div>

            <Button className="w-fit" type="submit">
                {submitLabel}
            </Button>
        </Form>
    );
}
