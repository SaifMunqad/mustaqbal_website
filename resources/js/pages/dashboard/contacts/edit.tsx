import DashboardPage from '@/components/dashboard/dashboard-page';
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
                <input name="name" required defaultValue={contact.name} className="rounded border p-2" />
                <input name="email" type="email" required defaultValue={contact.email} className="rounded border p-2" />
                <input name="phone" defaultValue={contact.phone ?? ''} className="rounded border p-2" />
                <input name="subject" defaultValue={contact.subject ?? ''} className="rounded border p-2" />
                <textarea name="message" required defaultValue={contact.message} className="h-32 rounded border p-2" />
                <input name="resolved_at" type="datetime-local" defaultValue={toDateTimeInput(contact.resolved_at)} className="rounded border p-2" />
                <button className="w-fit rounded bg-blue-600 px-4 py-2 text-white" type="submit">Update</button>
            </Form>
        </DashboardPage>
    );
}

