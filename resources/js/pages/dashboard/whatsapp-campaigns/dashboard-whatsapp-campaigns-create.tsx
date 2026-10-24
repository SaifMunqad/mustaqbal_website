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
import { useTranslation } from 'react-i18next';

export default function DashboardWhatsAppCampaignsCreate() {
    const { t } = useTranslation();
    const { counts, configured } = usePage<{
        counts: { contacts: number };
        configured: boolean;
    }>().props;
    const { onError } = useFormToast(
        t('dashboard.whatsappCampaigns.form.queued'),
    );
    const [customNumbers, setCustomNumbers] = useState('');
    const [source, setSource] = useState('contacts');
    const [mode, setMode] = useState('text');
    const [importNote, setImportNote] = useState<string | null>(null);

    const handleExtract = (result: ExtractedPhones) => {
        if (result.phones.length === 0) {
            setImportNote(t('dashboard.whatsappCampaigns.form.noValidPhones'));
            return;
        }

        setCustomNumbers(result.phones.join('\n'));
        setSource('custom');

        const notes = [
            t('dashboard.whatsappCampaigns.form.numbersFound', {
                count: result.phones.length,
            }),
        ];

        if (result.column) {
            notes.push(
                t('dashboard.whatsappCampaigns.form.fromColumn', {
                    column: result.column,
                }),
            );
        }

        if (result.duplicates > 0) {
            notes.push(
                t('dashboard.whatsappCampaigns.form.duplicatesRemoved', {
                    count: result.duplicates,
                }),
            );
        }

        if (result.invalid > 0) {
            notes.push(
                t('dashboard.whatsappCampaigns.form.invalidSkipped', {
                    count: result.invalid,
                }),
            );
        }

        setImportNote(
            t('dashboard.whatsappCampaigns.form.importNote', {
                notes: notes.join(' · '),
            }),
        );
    };

    if (!configured) {
        return (
            <DashboardPage
                titleKey="dashboard.whatsappCampaigns.createTitle"
                breadcrumbs={[
                    { title: t('dashboard.title'), href: '/dashboard' },
                    {
                        title: t('dashboard.whatsappCampaigns.title'),
                        href: campaigns.index.url(),
                    },
                ]}
            >
                <div className="max-w-2xl space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="size-5" />
                        <h2 className="text-lg font-semibold">
                            {t(
                                'dashboard.whatsappCampaigns.form.notConfiguredTitle',
                            )}
                        </h2>
                    </div>
                    <p className="text-sm">
                        {t(
                            'dashboard.whatsappCampaigns.form.notConfiguredBody',
                        )}
                    </p>
                    <Button asChild className="w-fit">
                        <Link href={settings.edit.url()}>
                            {t('dashboard.whatsappCampaigns.form.configure')}
                        </Link>
                    </Button>
                </div>
            </DashboardPage>
        );
    }

    return (
        <DashboardPage
            titleKey="dashboard.whatsappCampaigns.createTitle"
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                {
                    title: t('dashboard.whatsappCampaigns.title'),
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
                    label={t('dashboard.whatsappCampaigns.form.recipients')}
                    name="recipient_source"
                    required
                    defaultValue={source}
                    onChange={setSource}
                    hint={t(
                        'dashboard.whatsappCampaigns.form.recipientsHint',
                    )}
                    options={[
                        {
                            value: 'contacts',
                            label: t(
                                'dashboard.whatsappCampaigns.form.allContacts',
                                { count: counts.contacts },
                            ),
                        },
                        {
                            value: 'custom',
                            label: t(
                                'dashboard.whatsappCampaigns.form.customList',
                            ),
                        },
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
                            label={t(
                                'dashboard.whatsappCampaigns.form.numberList',
                            )}
                            name="custom_numbers"
                            value={customNumbers}
                            onChange={(event) => setCustomNumbers(event.target.value)}
                            className="h-32"
                            placeholder={'+93700123456\n+93799123456'}
                            hint={t(
                                'dashboard.whatsappCampaigns.form.numberListHint',
                            )}
                        />
                    </>
                )}

                <SelectField
                    key={mode}
                    label={t('dashboard.whatsappCampaigns.form.messageType')}
                    name="mode"
                    required
                    defaultValue={mode}
                    onChange={setMode}
                    hint={t(
                        'dashboard.whatsappCampaigns.form.messageTypeHint',
                    )}
                    options={[
                        {
                            value: 'text',
                            label: t(
                                'dashboard.whatsappCampaigns.form.freeText',
                            ),
                        },
                        {
                            value: 'template',
                            label: t(
                                'dashboard.whatsappCampaigns.form.template',
                            ),
                        },
                    ]}
                />

                {mode === 'text' ? (
                    <TextAreaField
                        label={t('dashboard.whatsappCampaigns.form.message')}
                        name="message"
                        required
                        className="h-40"
                        placeholder={t(
                            'dashboard.whatsappCampaigns.form.messagePlaceholder',
                        )}
                        hint={t(
                            'dashboard.whatsappCampaigns.form.messageHint',
                        )}
                    />
                ) : (
                    <>
                        <TextField
                            label={t(
                                'dashboard.whatsappCampaigns.form.templateName',
                            )}
                            name="template_name"
                            required
                            placeholder={t(
                                'dashboard.whatsappCampaigns.form.templateNamePlaceholder',
                            )}
                            hint={t(
                                'dashboard.whatsappCampaigns.form.templateNameHint',
                            )}
                        />
                        <TextField
                            label={t(
                                'dashboard.whatsappCampaigns.form.templateLanguage',
                            )}
                            name="template_language"
                            required
                            defaultValue="en"
                            placeholder="en"
                            hint={t(
                                'dashboard.whatsappCampaigns.form.templateLanguageHint',
                            )}
                        />
                        <TextAreaField
                            label={t(
                                'dashboard.whatsappCampaigns.form.templateVariables',
                            )}
                            name="template_variables"
                            className="h-24"
                            placeholder={'Ahmad\nMonday'}
                            hint={t(
                                'dashboard.whatsappCampaigns.form.templateVariablesHint',
                            )}
                        />
                    </>
                )}

                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    {t('dashboard.whatsappCampaigns.form.sendingNotice')}
                </div>
                <Button className="w-fit" type="submit">
                    {t('dashboard.whatsappCampaigns.form.send')}
                </Button>
            </Form>
        </DashboardPage>
    );
}
