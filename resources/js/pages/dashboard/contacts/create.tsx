import DashboardPage from '@/components/dashboard/dashboard-page';
import { TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { Form } from '@inertiajs/react';

export default function DashboardContactsCreate() {
    return (
        <DashboardPage titleKey="dashboard.contacts.createTitle">
            <Form action="/dashboard/contacts" method="post" className="grid gap-3 rounded-xl border p-4">
                <TextField label="Name" name="name" required />
                <TextField label="Email" name="email" type="email" required />
                <TextField label="Phone" name="phone" />
                <TextField label="Subject" name="subject" />
                <TextAreaField label="Message" name="message" required />
                <Button className="w-fit" type="submit">
                    Save
                </Button>
            </Form>
        </DashboardPage>
    );
}

