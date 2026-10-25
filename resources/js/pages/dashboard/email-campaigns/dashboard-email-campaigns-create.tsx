/**
 * Compose a bulk email campaign.
 *
 * Recipients can be typed, pasted or imported from a spreadsheet (parsed in the
 * browser), and are normalised and de-duplicated into a chip list before
 * submission so the server never receives the same address twice.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import RichTextEditor from '@/components/editor/rich-text-editor';
import ExcelEmailsImport, {
    type ExtractedEmails,
} from '@/components/dashboard/import/excel-emails-import';
import { FieldWrapper, SelectField, TextField } from '@/components/form/form-fields';
import RecipientChipField from '@/components/form/recipient-chip-field';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { cn } from '@/lib/utils';
import campaigns from '@/routes/dashboard/email-campaigns';
import { Form, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const EMAIL_RE = /^[^\s@,;:<>]+@[^\s@,;:<>]+(?:\.[^\s@,;:<>]+)+$/;

/** Accepts one address and returns it lowercased, or null when invalid. */
const normalizeEmail = (raw: string): string | null => {
    const value = raw.trim().toLowerCase();

    return EMAIL_RE.test(value) ? value : null;
};

interface ImportNote {
    tone: 'success' | 'error';
    text: string;
}

export default function DashboardEmailCampaignsCreate() {
    const { t, i18n } = useTranslation();
    const { counts, jobs, initialSource, initialJobFilter } = usePage<{
        counts: {
            users: number;
            contacts: number;
            selected_applicants: number;
        };
        jobs: Array<{ id: number; title: string }>;
        initialSource: string;
        initialJobFilter: number | null;
    }>().props;
    const { onError } = useFormToast(t('dashboard.emailCampaigns.form.queued'));

    const [emails, setEmails] = useState<string[]>([]);
    const [body, setBody] = useState('');
    const [source, setSource] = useState(initialSource || '');
    const [jobFilter, setJobFilter] = useState(
        initialJobFilter ? String(initialJobFilter) : '',
    );
    const [importNote, setImportNote] = useState<ImportNote | null>(null);

    /** Adds imported addresses to whatever is already in the chip list. */
    const mergeEmails = (incoming: string[]) => {
        const seen = new Set(emails.map((email) => email.toLowerCase()));
        const next = [...emails];
        let added = 0;
        let duplicates = 0;

        incoming.forEach((email) => {
            const key = email.toLowerCase();

            if (seen.has(key)) {
                duplicates += 1;
                return;
            }

            seen.add(key);
            next.push(key);
            added += 1;
        });

        if (added > 0) {
            setEmails(next);
        }

        return { added, duplicates };
    };

    const handleExtract = (result: ExtractedEmails) => {
        if (result.emails.length === 0) {
            setImportNote({
                tone: 'error',
                text: t('dashboard.emailCampaigns.form.noValidEmails'),
            });
            return;
        }

        const { added, duplicates } = mergeEmails(result.emails);
        const notes = [
            t('dashboard.emailCampaigns.form.addedToList', { count: added }),
        ];

        if (duplicates > 0) {
            notes.push(
                t('dashboard.emailCampaigns.form.alreadyListed', {
                    count: duplicates,
                }),
            );
        }

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

        setImportNote({
            tone: 'success',
            text: t('dashboard.emailCampaigns.form.importNote', {
                notes: notes.join(' · '),
            }),
        });
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
                className="grid max-w-3xl gap-4 rounded-xl border p-4"
            >
                {({ errors, processing }) => (
                    <>
                        <SelectField
                            key={source}
                            label={t(
                                'dashboard.emailCampaigns.form.recipients',
                            )}
                            name="recipient_source"
                            required
                            defaultValue={source}
                            onChange={setSource}
                            hint={t(
                                'dashboard.emailCampaigns.form.recipientsHint',
                            )}
                            error={errors.recipient_source}
                            options={[
                                {
                                    value: 'users',
                                    label: t(
                                        'dashboard.emailCampaigns.form.allUsers',
                                        { count: counts.users },
                                    ),
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
                                    value: 'selected_applicants',
                                    label: t(
                                        'dashboard.emailCampaigns.form.selectedApplicants',
                                        { count: counts.selected_applicants },
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

                        {source === 'selected_applicants' ? (
                            <div className="grid gap-2 rounded-xl border border-dashed p-4">
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'dashboard.emailCampaigns.form.selectedApplicantsHint',
                                    )}
                                </p>
                                <SelectField
                                    key={jobFilter}
                                    label={t(
                                        'dashboard.emailCampaigns.form.filterByJob',
                                    )}
                                    name="job_filter"
                                    defaultValue={jobFilter}
                                    onChange={setJobFilter}
                                    options={[
                                        {
                                            value: '',
                                            label: t(
                                                'dashboard.emailCampaigns.form.allSelectedJobs',
                                            ),
                                        },
                                        ...jobs.map((job) => ({
                                            value: String(job.id),
                                            label: job.title,
                                        })),
                                    ]}
                                />
                            </div>
                        ) : null}

                        {source === 'custom' ? (
                            <div className="grid gap-3 rounded-xl border border-dashed p-4">
                                <RecipientChipField
                                    label={t(
                                        'dashboard.emailCampaigns.form.emailList',
                                    )}
                                    name="custom_emails"
                                    kind="email"
                                    values={emails}
                                    onChange={setEmails}
                                    normalize={normalizeEmail}
                                    placeholder={
                                        'parent@example.com, relative@example.com'
                                    }
                                    hint={t(
                                        'dashboard.emailCampaigns.form.emailListHint',
                                    )}
                                    error={errors.custom_emails}
                                />
                                <ExcelEmailsImport onExtract={handleExtract} />
                            </div>
                        ) : null}

                        {importNote ? (
                            <div
                                className={cn(
                                    'rounded-lg p-3 text-sm',
                                    importNote.tone === 'success'
                                        ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
                                        : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200',
                                )}
                            >
                                {importNote.text}
                            </div>
                        ) : null}

                        <TextField
                            label={t('dashboard.emailCampaigns.form.subject')}
                            name="subject"
                            required
                            placeholder={t(
                                'dashboard.emailCampaigns.form.subjectPlaceholder',
                            )}
                            error={errors.subject}
                        />

                        <FieldWrapper
                            label={t('dashboard.emailCampaigns.form.message')}
                            hint={t(
                                'dashboard.emailCampaigns.form.messageHint',
                            )}
                            error={errors.body}
                        >
                            <RichTextEditor
                                name="body"
                                value={body}
                                onChange={setBody}
                                allowChart={false}
                                dir={i18n.dir() === 'rtl' ? 'rtl' : 'ltr'}
                                placeholder={t(
                                    'dashboard.emailCampaigns.form.messagePlaceholder',
                                )}
                            />
                        </FieldWrapper>

                        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            {t('dashboard.emailCampaigns.form.sendingNotice')}
                        </div>

                        <Button
                            className="w-fit"
                            type="submit"
                            disabled={processing}
                        >
                            {t('dashboard.emailCampaigns.form.send')}
                        </Button>
                    </>
                )}
            </Form>
        </DashboardPage>
    );
}
