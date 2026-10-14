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

export type { TranslationValues } from '@/components/language-tabs-editor';

export interface Program {
    id: number;
    program_type: string;
    fees: string;
    display_order: number;
    available_for_enroll: boolean;
}

const programTypeOptions = [
    { value: 'school', label: 'School' },
    { value: 'courses', label: 'Courses' },
    { value: 'islamic_madrasa', label: 'Islamic Madrasa' },
];

// Localized inputs rendered once per active language. The starred default
// language is required and used as the fallback; others are optional.
const translatableFields: TranslatableField[] = [
    {
        name: 'name',
        label: 'Program name',
        type: 'text',
        placeholder: 'e.g. Grade 1 - Primary',
        maxLength: 255,
    },
    {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'What this program covers...',
        rows: 5,
    },
    {
        name: 'schedule',
        label: 'Schedule',
        type: 'text',
        placeholder: 'e.g. Sat-Thu, 8:00 AM - 12:30 PM',
        maxLength: 255,
    },
    {
        name: 'age_recommendation',
        label: 'Age recommendation',
        type: 'text',
        placeholder: 'e.g. 6-12 years',
        maxLength: 255,
    },
    {
        name: 'classroom_number',
        label: 'Classroom',
        type: 'text',
        placeholder: 'e.g. A-01',
        required: false,
        maxLength: 100,
    },
];

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
    return (
        <Form {...formProps} onError={toastOnError} className="space-y-4">
            <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-2">
                <SelectField
                    label="Program type"
                    name="program_type"
                    required
                    defaultValue={program?.program_type ?? 'school'}
                    options={programTypeOptions}
                />
                <TextField
                    label="Fees"
                    name="fees"
                    required
                    type="number"
                    step="0.01"
                    defaultValue={program?.fees ?? ''}
                    placeholder="Fees"
                />
                <TextField
                    label="Display order"
                    name="display_order"
                    type="number"
                    defaultValue={program?.display_order ?? ''}
                    placeholder="Display order"
                />
                <CheckboxField
                    label="Available for enroll"
                    name="available_for_enroll"
                    value="1"
                    defaultChecked={
                        program ? program.available_for_enroll : true
                    }
                />
            </div>

            <div className="space-y-3 rounded-xl border p-4">
                <div>
                    <h2 className="text-sm font-semibold">Localized content</h2>
                    <p className="text-sm text-muted-foreground">
                        Add the name, description, schedule, age and classroom
                        for each language. The starred language is required and
                        used as the fallback.
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
