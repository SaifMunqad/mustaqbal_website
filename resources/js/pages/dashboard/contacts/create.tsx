import DashboardPage from '@/components/dashboard/dashboard-page';
import { Form } from '@inertiajs/react';

export default function DashboardContactsCreate() {
    return (
        <DashboardPage titleKey="dashboard.contacts.createTitle">
            <Form action="/dashboard/contacts" method="post" className="grid gap-3 rounded-xl border p-4">
                <input name="name" required className="rounded border p-2" placeholder="Name" />
                <input name="email" type="email" required className="rounded border p-2" placeholder="Email" />
                <input name="phone" className="rounded border p-2" placeholder="Phone" />
                <input name="subject" className="rounded border p-2" placeholder="Subject" />
                <textarea name="message" required className="h-32 rounded border p-2" placeholder="Message" />
                <button className="w-fit rounded bg-blue-600 px-4 py-2 text-white" type="submit">Save</button>
            </Form>
        </DashboardPage>
    );
}

