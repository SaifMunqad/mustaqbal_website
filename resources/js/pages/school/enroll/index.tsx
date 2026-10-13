import { DateField, TextAreaField, TextField } from '@/components/form-fields';
import { useToast } from '@/components/toast';
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import { Head, Link } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

function SchoolEnroll() {
    const { t } = useTranslation();
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
            const errorMessage = data.message ?? t('enroll.submitFailed');
            setMessage(errorMessage);
            error(t('enroll.failed'), errorMessage);
            return;
        }

        const successMessage = data.message ?? t('enroll.submitSuccess');
        setMessage(successMessage);
        success(t('enroll.submitted'), successMessage);
    };

    return (
        <>
            <Head title={t('enroll.title')} />
            <Reveal direction="fade" defaultInView>
                <section className="rounded-3xl bg-white p-6 shadow-sm md:p-10 dark:bg-gray-900">
                    <h1 className="text-2xl font-bold">
                        {t('enroll.heading')}
                    </h1>
                    <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
                        <TextField
                            label={t('enroll.studentName')}
                            name="student_name"
                            placeholder={t('enroll.studentName')}
                            required
                        />
                        <TextField
                            label={t('enroll.guardianName')}
                            name="guardian_name"
                            placeholder={t('enroll.guardianName')}
                            required
                        />
                        <TextField
                            label={t('enroll.guardianEmail')}
                            name="email"
                            type="email"
                            placeholder={t('enroll.guardianEmail')}
                            required
                        />
                        <TextField
                            label={t('enroll.phone')}
                            name="phone"
                            placeholder={t('enroll.phone')}
                            required
                        />
                        <TextField
                            label={t('enroll.grade')}
                            name="grade"
                            placeholder={t('enroll.grade')}
                            required
                        />
                        <DateField
                            label={t('enroll.dateOfBirth')}
                            name="date_of_birth"
                            calendar="persian"
                            required
                        />
                        <TextAreaField
                            label={t('enroll.address')}
                            name="address"
                            placeholder={t('enroll.address')}
                            required
                        />
                        <TextAreaField
                            label={t('enroll.notes')}
                            name="notes"
                            placeholder={t('enroll.notesOptional')}
                        />
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                name="prefers_email_updates"
                                defaultChecked
                                value="1"
                            />
                            {t('enroll.emailUpdates')}
                        </label>
                        <button
                            className="rounded bg-blue-600 px-4 py-2 text-white"
                            type="submit"
                        >
                            {t('enroll.submit')}
                        </button>
                    </form>
                    {message ? (
                        <p className="mt-4 text-sm text-green-600">{message}</p>
                    ) : null}
                    <Link
                        href="/school/enroll/resend-email"
                        className="mt-4 inline-block text-sm text-blue-600 underline"
                    >
                        {t('enroll.resendLink')}
                    </Link>
                </section>
            </Reveal>
        </>
    );
}

SchoolEnroll.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolEnroll;
