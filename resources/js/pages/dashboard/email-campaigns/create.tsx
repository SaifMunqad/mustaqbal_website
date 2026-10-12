import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import campaigns from '@/routes/dashboard/email-campaigns';
import { Form, usePage } from '@inertiajs/react';

export default function DashboardEmailCampaignsCreate() {
    const { counts } = usePage<{ counts: { users: number; contacts: number } }>().props;
    const { onError } = useFormToast('Campaign queued successfully.');

    return (
        <DashboardPage
            titleKey="dashboard.emailCampaigns.createTitle"
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Bulk Email', href: campaigns.index.url() },
            ]}
        >
            <Form
                {...campaigns.store.form()}
                onError={onError}
                className="grid max-w-2xl gap-4 rounded-xl border p-4"
            >
                <SelectField
                    label="Recipients"
                    name="recipient_source"
                    required
                    hint="Each recipient receives the message as an independent, personal email — never a group or BCC send."
                    options={[
                        { value: 'users', label: `All active users (${counts.users})` },
                        { value: 'contacts', label: `All contact emails (${counts.contacts})` },
                        { value: 'users_contacts', label: 'Users + contacts, deduplicated' },
                        { value: 'custom', label: 'Custom email list (paste below)' },
                    ]}
                />
                <TextAreaField
                    label="Email list"
                    name="custom_emails"
                    className="h-32"
                    placeholder={'parent@example.com\nrelative@example.com'}
                    hint="One email per line (or separated by commas). Only used with the custom list option."
                />
                <TextField label="Subject" name="subject" required placeholder="Eid Mubarak — school closure notice" />
                <TextAreaField
                    label="Message"
                    name="body"
                    required
                    className="h-48"
                    placeholder="Write the announcement exactly as your families should read it…"
                />
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    Sending starts immediately once you submit. You can watch progress and retry failures on the
                    campaign page.
                </div>
                <Button className="w-fit" type="submit">
                    Send campaign
                </Button>
            </Form>
        </DashboardPage>
    );
}
