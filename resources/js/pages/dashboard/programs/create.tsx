import DashboardPage from '@/components/dashboard/dashboard-page';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { useFormToast } from '@/components/use-form-toast';
import { Form } from '@inertiajs/react';
import programs from '@/routes/dashboard/programs';

export default function DashboardProgramsCreate() {
    const { onError } = useFormToast('Program created successfully.');

    return (
        <DashboardPage titleKey="dashboard.programs.createTitle">
            <Form {...programs.store.form()} onError={onError} className="grid gap-3 rounded-xl border p-4 md:grid-cols-2">
                <TextField label="Program name" name="name" required placeholder="Program name" />
                <SelectField label="Program type" name="program_type" required defaultValue="school">
                    <option value="school">School</option>
                    <option value="courses">Courses</option>
                    <option value="islamic_madrasa">Islamic Madrasa</option>
                </SelectField>
                <TextField label="Schedule" name="schedule" required placeholder="Schedule" />
                <TextField label="Fees" name="fees" required type="number" step="0.01" placeholder="Fees" />
                <TextField label="Age recommendation" name="age_recommendation" required placeholder="Age recommendation" />
                <TextField label="Classroom" name="classroom_number" placeholder="Classroom" />
                <TextField label="Display order" name="display_order" type="number" placeholder="Display order" />
                <CheckboxField label="Available for enroll" name="available_for_enroll" value="1" defaultChecked className="md:col-span-2" />
                <TextAreaField label="Description" name="description" required className="h-36 md:col-span-2" placeholder="Description" />
                <button className="w-fit rounded bg-blue-600 px-4 py-2 text-white md:col-span-2" type="submit">Save</button>
            </Form>
        </DashboardPage>
    );
}

