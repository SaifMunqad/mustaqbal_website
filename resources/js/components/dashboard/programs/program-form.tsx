import { Form } from '@inertiajs/react';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';

export interface Program {
    id: number;
    name: string;
    program_type: string;
    schedule: string;
    fees: string;
    age_recommendation: string;
    classroom_number?: string | null;
    display_order: number;
    description: string;
    available_for_enroll: boolean;
}

const programTypeOptions = [
    { value: 'school', label: 'School' },
    { value: 'courses', label: 'Courses' },
    { value: 'islamic_madrasa', label: 'Islamic Madrasa' },
];

interface ProgramFormProps {
    // Inertia route target, e.g. programs.store.form() / programs.update.form(id).
    formProps: { action: string; method: 'post' | 'put' | 'patch' };
    submitLabel: string;
    toastOnError: (errors: Record<string, string>) => void;
    // Present on edit; absent on create so fields render empty.
    program?: Program;
}

/**
 * Shared create/edit form for programs. Create passes no `program`, so the type
 * defaults to "school" and enrollment is checked; edit seeds every field from the
 * record.
 */
export default function ProgramForm({
    formProps,
    submitLabel,
    toastOnError,
    program,
}: ProgramFormProps) {
    return (
        <Form {...formProps} onError={toastOnError} className="grid gap-3 rounded-xl border p-4 md:grid-cols-2">
            <TextField label="Program name" name="name" required defaultValue={program?.name ?? ''} placeholder="Program name" />
            <SelectField
                label="Program type"
                name="program_type"
                required
                defaultValue={program?.program_type ?? 'school'}
                options={programTypeOptions}
            />
            <TextField label="Schedule" name="schedule" required defaultValue={program?.schedule ?? ''} placeholder="Schedule" />
            <TextField label="Fees" name="fees" required type="number" step="0.01" defaultValue={program?.fees ?? ''} placeholder="Fees" />
            <TextField label="Age recommendation" name="age_recommendation" required defaultValue={program?.age_recommendation ?? ''} placeholder="Age recommendation" />
            <TextField label="Classroom" name="classroom_number" defaultValue={program?.classroom_number ?? ''} placeholder="Classroom" />
            <TextField label="Display order" name="display_order" type="number" defaultValue={program?.display_order ?? ''} placeholder="Display order" />
            <CheckboxField
                label="Available for enroll"
                name="available_for_enroll"
                value="1"
                defaultChecked={program ? program.available_for_enroll : true}
                className="md:col-span-2"
            />
            <TextAreaField label="Description" name="description" required defaultValue={program?.description ?? ''} className="h-36 md:col-span-2" placeholder="Description" />
            <Button className="w-fit md:col-span-2" type="submit">
                {submitLabel}
            </Button>
        </Form>
    );
}
