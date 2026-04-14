import DashboardPage from '@/components/dashboard/dashboard-page';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';
import programs from '@/routes/dashboard/programs';

interface Program {
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

export default function DashboardProgramsEdit() {
    const { program } = usePage<{ program: Program }>().props;
    const { onError } = useFormToast('Program updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.programs.editTitle">
            <Form {...programs.update.form(program.id)} onError={onError} className="grid gap-3 rounded-xl border p-4 md:grid-cols-2">
                <TextField label="Program name" name="name" required defaultValue={program.name} />
                <SelectField label="Program type" name="program_type" required defaultValue={program.program_type}>
                    <option value="school">School</option>
                    <option value="courses">Courses</option>
                    <option value="islamic_madrasa">Islamic Madrasa</option>
                </SelectField>
                <TextField label="Schedule" name="schedule" required defaultValue={program.schedule} />
                <TextField label="Fees" name="fees" required type="number" step="0.01" defaultValue={program.fees} />
                <TextField label="Age recommendation" name="age_recommendation" required defaultValue={program.age_recommendation} />
                <TextField label="Classroom" name="classroom_number" defaultValue={program.classroom_number ?? ''} />
                <TextField label="Display order" name="display_order" type="number" defaultValue={program.display_order} />
                <CheckboxField label="Available for enroll" name="available_for_enroll" value="1" defaultChecked={program.available_for_enroll} className="md:col-span-2" />
                <TextAreaField label="Description" name="description" required defaultValue={program.description} className="h-36 md:col-span-2" />
                <button className="w-fit rounded bg-blue-600 px-4 py-2 text-white md:col-span-2" type="submit">Update</button>
            </Form>
        </DashboardPage>
    );
}

