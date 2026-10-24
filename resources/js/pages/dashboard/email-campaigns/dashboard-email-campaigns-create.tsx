import DashboardPage from '@/components/dashboard/dashboard-page';
import ExcelEmailsImport, { type ExtractedEmails } from '@/components/dashboard/import/excel-emails-import';
import { SelectField, TextAreaField, TextField } from '@/components/form/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/feedback/use-form-toast';
import campaigns from '@/routes/dashboard/email-campaigns';
import { Form, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function DashboardEmailCampaignsCreate() {
    const { t } = useTranslation();
    const { counts } = usePage<{ counts: { users: number; contacts: number } }>().props;
    const { onError } = useFormToast(t('dashboard.emailCampaigns.form.queued'));
    const [customEmails, setCustomEmails] = useState('');
    const [source, setSource] = useState('');
    const [importNote, setImportNote] = useState<string | null>(null);

    const handleExtract = (result: ExtractedEmails) => {
        if (result.emails.length === 0) {
            setImportNote(t('dashboard.emailCampaigns.form.noValidEmails'));
            return;
        }

        setCustomEmails(result.emails.join('\n'));
        setSource('custom');

        const notes = [
            t('dashboard.emailCampaigns.form.contactsFound', {
                count: result.emails.length,
            }),
        ];

        if (result.column) {
            notes.push(
                t('dashboard.emailCampaigns.form.fromColumn', {
                    column: result.column,
                }),
            );
        }

        if (result.duplicates > 0) {
            notes.push(
                t('dashboard.emailCampaigns.form.duplicatesRemoved', {
                    count: result.duplicates,
                }),
            );
        }

        if (result.invalid > 0) {
            notes.push(
                t('dashboard.emailCampaigns.form.invalidSkipped', {
                    count: result.invalid,
                }),
            );
        }

        setImportNote(
            t('dashboard.emailCampaigns.form.importNote', {
                notes: notes.join(' · '),
            }),
        );
    };

    return (
        <DashboardPage
            titleKey="dashboard.emailCampaigns.createTitle"
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                {
                    title: t('dashboard.emailCampaigns.title'),
                    href: campaigns.index.url(),
                },
            ]}
        >
            <Form
                {...campaigns.store.form()}
                onError={onError}
                className="grid max-w-2xl gap-4 rounded-xl border p-4"
            >
                <SelectField
                    key={source}
                    label={t('dashboard.emailCampaigns.form.recipients')}
                    name="recipient_source"
                    required
                    defaultValue={source}
                    hint={t('dashboard.emailCampaigns.form.recipientsHint')}
                    options={[
                        {
                            value: 'users',
                            label: t('dashboard.emailCampaigns.form.allUsers', {
                                count: counts.users,
                            }),
                        },
                        {
                            value: 'contacts',
                            label: t(
                                'dashboard.emailCampaigns.form.allContacts',
                                { count: counts.contacts },
                            ),
                        },
                        {
                            value: 'users_contacts',
                            label: t(
                                'dashboard.emailCampaigns.form.usersContacts',
                            ),
                        },
                        {
                            value: 'custom',
                            label: t(
                                'dashboard.emailCampaigns.form.customList',
                            ),
                        },
                    ]}
                />
                <ExcelEmailsImport onExtract={handleExtract} />
                {importNote && (
                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                        {importNote}
                    </div>
                )}
                <TextAreaField
                    label={t('dashboard.emailCampaigns.form.emailList')}
                    name="custom_emails"
                    value={customEmails}
                    onChange={(event) => setCustomEmails(event.target.value)}
                    className="h-32"
                    placeholder={'parent@example.com\nrelative@example.com'}
                    hint={t('dashboard.emailCampaigns.form.emailListHint')}
                />
                <TextField
                    label={t('dashboard.emailCampaigns.form.subject')}
                    name="subject"
                    required
                    placeholder={t(
                        'dashboard.emailCampaigns.form.subjectPlaceholder',
                    )}
                />
                <TextAreaField
                    label={t('dashboard.emailCampaigns.form.message')}
                    name="body"
                    required
                    className="h-48"
                    placeholder={t(
                        'dashboard.emailCampaigns.form.messagePlaceholder',
                    )}
                />
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    {t('dashboard.emailCampaigns.form.sendingNotice')}
                </div>
                <Button className="w-fit" type="submit">
                    {t('dashboard.emailCampaigns.form.send')}
                </Button>
            </Form>
        </DashboardPage>
    );
}
