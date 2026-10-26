/**
 * Enrolment form.
 *
 * Submitted through Inertia's `<Form>` so the CSRF token is handled automatically
 * and validation failures redirect back with an error bag surfaced inline. Fields
 * are grouped into labelled sections and use the dashboard's shared form controls
 * + Button so the public form matches the rest of the system.
 */
import {
    DateField,
    TextAreaField,
    TextField,
} from '@/components/form/form-fields';
import { Button } from '@/components/ui/button';
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import { Form, Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/** A titled group of fields inside the enrolment form. */
function FormSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <fieldset className="rounded-2xl border border-brand-border bg-white/50 p-4 dark:bg-transparent">
            <legend className="px-1 text-sm font-semibold text-brand-ink">
                {title}
            </legend>
            {/* Two columns on wider screens so short inputs stop hogging a full
                line; wide fields opt back to full width with `FullWidth`. */}
            <div className="grid gap-3 sm:grid-cols-2">{children}</div>
        </fieldset>
    );
}

/** Spans the full grid row inside a `FormSection` (for textareas/consent). */
function FullWidth({ children }: { children: ReactNode }) {
    return <div className="sm:col-span-2">{children}</div>;
}

function SchoolEnroll() {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('enroll.title')} />
            <Reveal direction="fade" defaultInView>
                <section className="rounded-3xl bg-brand-soft p-6 shadow-sm md:p-10">
                    <h1 className="text-2xl font-bold">
                        {t('enroll.heading')}
                    </h1>
                    <Form
                        action="/community/enrollments"
                        method="post"
                        className="mt-6 grid gap-5"
                        disableWhileProcessing
                    >
                        {({ processing, errors }) => (
                            <>
                                <FormSection
                                    title={t('enroll.sections.student')}
                                >
                                    <TextField
                                        label={t('enroll.studentName')}
                                        name="student_name"
                                        placeholder={t('enroll.studentName')}
                                        autoComplete="off"
                                        error={errors.student_name}
                                        required
                                    />
                                    <TextField
                                        label={t('enroll.grade')}
                                        name="grade"
                                        placeholder={t('enroll.grade')}
                                        error={errors.grade}
                                        required
                                    />
                                    <DateField
                                        label={t('enroll.dateOfBirth')}
                                        name="date_of_birth"
                                        calendar="persian"
                                        error={errors.date_of_birth}
                                        required
                                    />
                                </FormSection>

                                <FormSection
                                    title={t('enroll.sections.guardian')}
                                >
                                    <TextField
                                        label={t('enroll.guardianName')}
                                        name="guardian_name"
                                        placeholder={t('enroll.guardianName')}
                                        autoComplete="name"
                                        error={errors.guardian_name}
                                        required
                                    />
                                    <TextField
                                        label={t('enroll.guardianEmail')}
                                        name="email"
                                        type="email"
                                        placeholder={t('enroll.guardianEmail')}
                                        autoComplete="email"
                                        error={errors.email}
                                        required
                                    />
                                    <TextField
                                        label={t('enroll.phone')}
                                        name="phone"
                                        type="tel"
                                        placeholder={t('enroll.phone')}
                                        autoComplete="tel"
                                        error={errors.phone}
                                        required
                                    />
                                </FormSection>

                                <FormSection
                                    title={t('enroll.sections.details')}
                                >
                                    <FullWidth>
                                        <TextAreaField
                                            label={t('enroll.address')}
                                            name="address"
                                            placeholder={t('enroll.address')}
                                            error={errors.address}
                                            required
                                        />
                                    </FullWidth>
                                    <FullWidth>
                                        <TextAreaField
                                            label={t('enroll.notes')}
                                            name="notes"
                                            placeholder={t('enroll.notesOptional')}
                                            error={errors.notes}
                                        />
                                    </FullWidth>
                                    <FullWidth>
                                        <label className="flex items-center gap-2 text-sm">
                                            {/* Native input so the form submits the
                                                flag by name (the shadcn checkbox is
                                                controlled and not form-submittable). */}
                                            <input
                                                type="checkbox"
                                                name="prefers_email_updates"
                                                defaultChecked
                                                value="1"
                                                className="size-4 rounded border-brand-border accent-brand"
                                            />
                                            <span>
                                                {t('enroll.emailUpdates')}
                                            </span>
                                        </label>
                                    </FullWidth>
                                </FormSection>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto"
                                >
                                    {t('enroll.submit')}
                                </Button>
                            </>
                        )}
                    </Form>
                    <Link
                        href="/school/enroll/resend-email"
                        className="mt-4 inline-block text-sm text-brand-ink underline"
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
