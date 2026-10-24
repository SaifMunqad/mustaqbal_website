/**
 * Single-purpose screen for re-requesting the enrolment confirmation email, used
 * when the original message never arrived.
 */
import { DateField, TextField } from '@/components/form/form-fields';
import { useToast } from '@/components/feedback/toast';
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import { Head } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

function SchoolEnrollResendEmail() {
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
            const errorMessage =
                data.message ?? t('enroll.resend.failedMessage');
            setMessage(errorMessage);
            error(t('enroll.resend.failed'), errorMessage);
            return;
        }

        const successMessage =
            data.message ?? t('enroll.resend.successMessage');
        setMessage(successMessage);
        success(t('enroll.resend.success'), successMessage);
    };

    return (
        <>
            <Head title={t('enroll.resend.title')} />
            <Reveal direction="fade" defaultInView>
                <section className="rounded-3xl bg-brand-soft p-6 shadow-sm md:p-10">
                    <h1 className="text-2xl font-bold">
                        {t('enroll.resend.heading')}
                    </h1>
                    <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
                        <TextField
                            label={t('enroll.guardianEmail')}
                            name="email"
                            type="email"
                            placeholder={t('enroll.guardianEmail')}
                            required
                        />
                        <DateField
                            label={t('enroll.dateOfBirth')}
                            name="date_of_birth"
                            calendar="islamic"
                            required
                        />
                        <button
                            className="rounded bg-brand px-4 py-2 text-brand-fg"
                            type="submit"
                        >
                            {t('enroll.resend.button')}
                        </button>
                    </form>
                    {message ? (
                        <p className="mt-4 text-sm text-green-600">{message}</p>
                    ) : null}
                </section>
            </Reveal>
        </>
    );
}

SchoolEnrollResendEmail.layout = (page: ReactNode) => (
    <MainLayout children={page} />
);

export default SchoolEnrollResendEmail;
