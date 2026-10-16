import DashboardPage from '@/components/dashboard/dashboard-page';
import ExcelPhonesImport, { type ExtractedPhones } from '@/components/excel-phones-import';
import { SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import campaigns from '@/routes/dashboard/whatsapp-campaigns';
import settings from '@/routes/dashboard/whatsapp-settings';
import { AlertTriangle } from 'lucide-react';
import { Form, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function DashboardWhatsAppCampaignsCreate() {
    const { counts, configured } = usePage<{
        counts: { contacts: number };
        configured: boolean;
    }>().props;
    const { onError } = useFormToast('WhatsApp campaign queued successfully.');
    const [customNumbers, setCustomNumbers] = useState('');
    const [source, setSource] = useState('contacts');
    const [mode, setMode] = useState('text');
    const [importNote, setImportNote] = useState<string | null>(null);

    const handleExtract = (result: ExtractedPhones) => {
        if (result.phones.length === 0) {
            setImportNote('No valid phone numbers were found in that file.');
            return;
        }

        setCustomNumbers(result.phones.join('\n'));
        setSource('custom');

        const notes = [`${result.phones.length} numbers found`];

        if (result.column) {
            notes.push(`from column “${result.column}”`);
        }

        if (result.duplicates > 0) {
            notes.push(`${result.duplicates} duplicates removed`);
        }

        if (result.invalid > 0) {
            notes.push(`${result.invalid} invalid skipped`);
        }

        setImportNote(`${notes.join(' · ')} — the list below is filled, ready to send.`);
    };

    if (!configured) {
        return (
            <DashboardPage
                titleKey="dashboard.whatsappCampaigns.createTitle"
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Bulk WhatsApp', href: campaigns.index.url() },
                ]}
            >
                <div className="max-w-2xl space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="size-5" />
                        <h2 className="text-lg font-semibold">WhatsApp is not configured</h2>
                    </div>
                    <p className="text-sm">
                        Before you can send a campaign, add your WhatsApp Business Cloud API credentials
                        (access token and phone number id). You can enter them yourself on the settings
                        screen — they are stored encrypted.
                    </p>
                    <Button asChild className="w-fit">
                        <Link href={settings.edit.url()}>Configure WhatsApp</Link>
                    </Button>
                </div>
            </DashboardPage>
        );
    }

    return (
        <DashboardPage
            titleKey="dashboard.whatsappCampaigns.createTitle"
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Bulk WhatsApp', href: campaigns.index.url() },
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
                    onChange={setSource}
                    hint="Each recipient receives the message as an independent WhatsApp message. Numbers must include a country code."
                    options={[
                        { value: 'contacts', label: `All contact numbers (${counts.contacts})` },
                        { value: 'custom', label: 'Custom number list (paste or import below)' },
                    ]}
                />

                {source === 'custom' && (
                    <>
                        <ExcelPhonesImport onExtract={handleExtract} />
                        {importNote && (
                            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                                {importNote}
                            </div>
                        )}
                        <TextAreaField
                            label="Number list"
                            name="custom_numbers"
                            value={customNumbers}
                            onChange={(event) => setCustomNumbers(event.target.value)}
                            className="h-32"
                            placeholder={'+93700123456\n+93799123456'}
                            hint="One number per line (or separated by commas/spaces), including the country code, or import them from an Excel/CSV file above."
                        />
                    </>
                )}

                <SelectField
                    key={mode}
                    label="Message type"
                    name="mode"
                    required
                    defaultValue={mode}
                    onChange={setMode}
                    hint="Cold bulk outreach must use an approved template. Free text only reaches people who messaged you in the last 24 hours."
                    options={[
                        { value: 'text', label: 'Free text message' },
                        { value: 'template', label: 'Approved template message' },
                    ]}
                />

                {mode === 'text' ? (
                    <TextAreaField
                        label="Message"
                        name="message"
                        required
                        className="h-40"
                        placeholder="Write the announcement exactly as your families should read it…"
                        hint="Plain WhatsApp text (up to 4096 characters)."
                    />
                ) : (
                    <>
                        <TextField
                            label="Template name"
                            name="template_name"
                            required
                            placeholder="order_confirmation"
                            hint="The exact name of your approved WhatsApp template."
                        />
                        <TextField
                            label="Template language"
                            name="template_language"
                            required
                            defaultValue="en"
                            placeholder="en"
                            hint="The template's language code (e.g. en, ar, ps), matching the approved version."
                        />
                        <TextAreaField
                            label="Template variables (optional)"
                            name="template_variables"
                            className="h-24"
                            placeholder={'Ahmad\nMonday'}
                            hint="One value per line, filling the template's {{1}}, {{2}}, … placeholders in order. Leave empty if the template has no variables."
                        />
                    </>
                )}

                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    Sending starts immediately once you submit. You can watch progress and retry failures on
                    the campaign page.
                </div>
                <Button className="w-fit" type="submit">
                    Send campaign
                </Button>
            </Form>
        </DashboardPage>
    );
}
