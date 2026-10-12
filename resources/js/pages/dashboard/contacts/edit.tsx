import DashboardPage from '@/components/dashboard/dashboard-page';
import { TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { Form, usePage } from '@inertiajs/react';

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
    const { contact } = usePage<{ contact: Contact }>().props;

    return (
        <DashboardPage titleKey="dashboard.contacts.editTitle">
            <Form action={`/dashboard/contacts/${contact.id}`} method="put" className="grid gap-3 rounded-xl border p-4">
                <TextField label="Name" name="name" required defaultValue={contact.name} />
                <TextField label="Email" name="email" type="email" required defaultValue={contact.email} />
                <TextField label="Phone" name="phone" defaultValue={contact.phone ?? ''} />
                <TextField label="Subject" name="subject" defaultValue={contact.subject ?? ''} />
                <TextAreaField label="Message" name="message" required defaultValue={contact.message} />
                <TextField label="Resolved at" name="resolved_at" type="datetime-local" defaultValue={toDateTimeInput(contact.resolved_at)} />
                <Button className="w-fit" type="submit">
                    Update
                </Button>
            </Form>
        </DashboardPage>
    );
}

