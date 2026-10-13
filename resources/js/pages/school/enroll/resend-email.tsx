import { FormEvent, ReactNode, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/app/main-layout';
import { DateField, TextField } from '@/components/form-fields';
import { useToast } from '@/components/toast';
import { useTranslation } from 'react-i18next';

function ResendEnrollmentEmailPage() {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');
    const { success, error } = useToast();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const response = await fetch('/community/enrollments/resend-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(Object.fromEntries(formData.entries())),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMessage = data.message ?? t('enroll.resend.failedMessage');
            setMessage(errorMessage);
            error(t('enroll.resend.failed'), errorMessage);
            return;
        }

        const successMessage = data.message ?? t('enroll.resend.successMessage');
        setMessage(successMessage);
        success(t('enroll.resend.success'), successMessage);
    };

    return (
        <>
            <Head title={t('enroll.resend.title')} />
            <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900 md:p-10">
                <h1 className="text-2xl font-bold">{t('enroll.resend.heading')}</h1>
                <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
                    <TextField
                        label={t('enroll.guardianEmail')}
                        name="email"
                        type="email"
                        placeholder={t('enroll.guardianEmail')}
                        required
                    />
                    <DateField label={t('enroll.dateOfBirth')} name="date_of_birth" calendar="islamic" required />
                    <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">
                        {t('enroll.resend.button')}
                    </button>
                </form>
                {message ? <p className="mt-4 text-sm text-green-600">{message}</p> : null}
            </section>
        </>
    );
}

ResendEnrollmentEmailPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default ResendEnrollmentEmailPage;

