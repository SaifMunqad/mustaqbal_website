import DashboardPage from '@/components/dashboard/dashboard-page';
import ExcelEmailsImport, { type ExtractedEmails } from '@/components/excel-emails-import';
import { SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import campaigns from '@/routes/dashboard/email-campaigns';
import { Form, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function DashboardEmailCampaignsCreate() {
    const { counts } = usePage<{ counts: { users: number; contacts: number } }>().props;
    const { onError } = useFormToast('Campaign queued successfully.');
    const [customEmails, setCustomEmails] = useState('');
    const [source, setSource] = useState('');
    const [importNote, setImportNote] = useState<string | null>(null);

    const handleExtract = (result: ExtractedEmails) => {
        if (result.emails.length === 0) {
            setImportNote('No valid email addresses were found in that file.');
            return;
        }

        setCustomEmails(result.emails.join('\n'));
        setSource('custom');

        const notes = [`${result.emails.length} contacts found`];

        if (result.column) {
            notes.push(`from column “${result.column}”`);
        }

        if (result.duplicates > 0) {
            notes.push(`${result.duplicates} duplicates removed`);
        }

        if (result.invalid > 0) {
            notes.push(`${result.invalid} invalid skipped`);
        }

        setImportNote(`${notes.join(' · ')} — the email list below is filled, ready to send.`);
    };

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
                    key={source}
                    label="Recipients"
                    name="recipient_source"
                    required
                    defaultValue={source}
                    hint="Each recipient receives the message as an independent, personal email — never a group or BCC send."
                    options={[
                        { value: 'users', label: `All active users (${counts.users})` },
                        { value: 'contacts', label: `All contact emails (${counts.contacts})` },
                        { value: 'users_contacts', label: 'Users + contacts, deduplicated' },
                        { value: 'custom', label: 'Custom email list (paste or import below)' },
                    ]}
                />
                <ExcelEmailsImport onExtract={handleExtract} />
                {importNote && (
                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                        {importNote}
                    </div>
                )}
                <TextAreaField
                    label="Email list"
                    name="custom_emails"
                    value={customEmails}
                    onChange={(event) => setCustomEmails(event.target.value)}
                    className="h-32"
                    placeholder={'parent@example.com\nrelative@example.com'}
                    hint="One email per line (or separated by commas/spaces), or import them from an Excel/CSV file above."
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
