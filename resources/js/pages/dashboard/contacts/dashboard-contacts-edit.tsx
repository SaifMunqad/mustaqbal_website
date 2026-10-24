/**
 * Edit a contact enquiry, including marking it resolved. The stored timestamp is
 * trimmed to the `datetime-local` input format on the way in.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { TextAreaField, TextField } from '@/components/form/form-fields';
import { Button } from '@/components/ui/button';
import { Form, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface Contact {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    message: string;
    resolved_at?: string | null;
}

const toDateTimeInput = (value?: string | null): string => {
    if (!value) return '';
    return value.slice(0, 16);
};

export default function DashboardContactsEdit() {
    const { t } = useTranslation();
    const { contact } = usePage<{ contact: Contact }>().props;

    return (
        <DashboardPage titleKey="dashboard.contacts.editTitle">
            <Form action={`/dashboard/contacts/${contact.id}`} method="put" className="grid gap-3 rounded-xl border p-4">
                <TextField label={t('dashboard.contacts.form.name')} name="name" required defaultValue={contact.name} />
                <TextField label={t('dashboard.contacts.form.email')} name="email" type="email" required defaultValue={contact.email} />
                <TextField label={t('dashboard.contacts.form.phone')} name="phone" defaultValue={contact.phone ?? ''} />
                <TextField label={t('dashboard.contacts.form.subject')} name="subject" defaultValue={contact.subject ?? ''} />
                <TextAreaField label={t('dashboard.contacts.form.message')} name="message" required defaultValue={contact.message} />
                <TextField label={t('dashboard.contacts.form.resolvedAt')} name="resolved_at" type="datetime-local" defaultValue={toDateTimeInput(contact.resolved_at)} />
                <Button className="w-fit" type="submit">
                    {t('dashboard.contacts.form.update')}
                </Button>
            </Form>
        </DashboardPage>
    );
}

