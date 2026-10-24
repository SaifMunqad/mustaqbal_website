import DashboardPage from '@/components/dashboard/dashboard-page';
import { TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { Form } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function DashboardContactsCreate() {
    const { t } = useTranslation();

    return (
        <DashboardPage titleKey="dashboard.contacts.createTitle">
            <Form action="/dashboard/contacts" method="post" className="grid gap-3 rounded-xl border p-4">
                <TextField label={t('dashboard.contacts.form.name')} name="name" required />
                <TextField label={t('dashboard.contacts.form.email')} name="email" type="email" required />
                <TextField label={t('dashboard.contacts.form.phone')} name="phone" />
                <TextField label={t('dashboard.contacts.form.subject')} name="subject" />
                <TextAreaField label={t('dashboard.contacts.form.message')} name="message" required />
                <Button className="w-fit" type="submit">
                    {t('dashboard.contacts.form.save')}
                </Button>
            </Form>
        </DashboardPage>
    );
}

