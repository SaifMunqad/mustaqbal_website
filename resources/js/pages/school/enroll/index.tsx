import { FormEvent, ReactNode, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/layouts/app/main-layout';
import { DateField, TextAreaField, TextField } from '@/components/form-fields';
import { useToast } from '@/components/toast';

function EnrollPage() {
    const [message, setMessage] = useState('');
    const { success, error } = useToast();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const payload = Object.fromEntries(formData.entries());

        const response = await fetch('/community/enrollments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMessage = data.message ?? 'Enrollment could not be submitted.';
            setMessage(errorMessage);
            error('Enrollment failed', errorMessage);
            return;
        }

        const successMessage = data.message ?? 'Enrollment submitted.';
        setMessage(successMessage);
        success('Enrollment submitted', successMessage);
    };

    return (
        <>
            <Head title="Enroll" />
            <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900 md:p-10">
                <h1 className="text-2xl font-bold">Student Enrollment</h1>
                <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
                    <TextField label="Student name" name="student_name" placeholder="Student name" required />
                    <TextField label="Guardian name" name="guardian_name" placeholder="Guardian name" required />
                    <TextField label="Guardian email" name="email" type="email" placeholder="Guardian email" required />
                    <TextField label="Phone" name="phone" placeholder="Phone" required />
                    <TextField label="Grade" name="grade" placeholder="Grade" required />
                    <DateField label="Date of birth" name="date_of_birth" calendar="persian" required />
                    <TextAreaField label="Address" name="address" placeholder="Address" required />
                    <TextAreaField label="Notes" name="notes" placeholder="Notes (optional)" />
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="prefers_email_updates" defaultChecked value="1" />
                        Receive enrollment updates by email
                    </label>
                    <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">
                        Submit enrollment
                    </button>
                </form>
                {message ? <p className="mt-4 text-sm text-green-600">{message}</p> : null}
                <Link href="/school/enroll/resend-email" className="mt-4 inline-block text-sm text-blue-600 underline">
                    Resend enrollment email
                </Link>
            </section>
        </>
    );
}

EnrollPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default EnrollPage;

