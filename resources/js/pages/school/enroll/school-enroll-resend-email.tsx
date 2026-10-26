/**
 * Single-purpose screen for re-requesting the enrolment confirmation email, used
 * when the original message never arrived. Submitted through Inertia's `<Form>`,
 * so the CSRF token is handled automatically and failures surface inline.
 */
import { DateField, TextField } from '@/components/form/form-fields';
import { Button } from '@/components/ui/button';
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import { Form, Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

function SchoolEnrollResendEmail() {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('enroll.resend.title')} />
            <Reveal direction="fade" defaultInView>
                <section className="rounded-3xl bg-brand-soft p-6 shadow-sm md:p-10">
                    <h1 className="text-2xl font-bold">
                        {t('enroll.resend.heading')}
                    </h1>
                    <Form
                        action="/community/enrollments/resend-email"
                        method="post"
                        className="mt-6 grid gap-3"
                        disableWhileProcessing
                    >
                        {({ processing, errors }) => (
                            <>
                                <TextField
                                    label={t('enroll.guardianEmail')}
                                    name="email"
                                    type="email"
                                    placeholder={t('enroll.guardianEmail')}
                                    error={errors.email}
                                    required
                                />
                                <DateField
                                    label={t('enroll.dateOfBirth')}
                                    name="date_of_birth"
                                    calendar="islamic"
                                    error={errors.date_of_birth}
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto"
                                >
                                    {t('enroll.resend.button')}
                                </Button>
                            </>
                        )}
                    </Form>
                    <Link
                        href="/school/enroll"
                        className="mt-4 inline-block text-sm text-brand-ink underline"
                    >
                        {t('enroll.title')}
                    </Link>
                </section>
            </Reveal>
        </>
    );
}

SchoolEnrollResendEmail.layout = (page: ReactNode) => (
    <MainLayout children={page} />
);

export default SchoolEnrollResendEmail;
