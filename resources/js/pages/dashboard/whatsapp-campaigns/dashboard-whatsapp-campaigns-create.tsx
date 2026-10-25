/**
 * Compose a bulk WhatsApp campaign.
 *
 * Phone numbers are normalised to the E.164 range using the same rule the server
 * enforces, and can be imported from a spreadsheet; the resulting list is
 * de-duplicated before sending.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import RichTextEditor from '@/components/editor/rich-text-editor';
import ExcelPhonesImport, {
    type ExtractedPhones,
} from '@/components/dashboard/import/excel-phones-import';
import {
    FieldWrapper,
    SelectField,
    TextAreaField,
    TextField,
} from '@/components/form/form-fields';
import RecipientChipField from '@/components/form/recipient-chip-field';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { cn } from '@/lib/utils';
import campaigns from '@/routes/dashboard/whatsapp-campaigns';
import settings from '@/routes/dashboard/whatsapp-settings';
import { Form, Link, usePage } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Keeps the digits a WhatsApp number may contain plus an optional leading "+",
 * accepting anything in the 7–15 digit E.164 range. Mirrors the server rule.
 */
const normalizePhone = (raw: string): string | null => {
    const trimmed = raw.trim();

    if (trimmed === '') {
        return null;
    }

    const plus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D+/g, '');

    if (digits.length < 7 || digits.length > 15) {
        return null;
    }

    return plus ? `+${digits}` : digits;
};

interface ImportNote {
    tone: 'success' | 'error';
    text: string;
}

export default function DashboardWhatsAppCampaignsCreate() {
    const { t, i18n } = useTranslation();
    const { counts, configured } = usePage<{
        counts: { contacts: number };
        configured: boolean;
    }>().props;
    const { onError } = useFormToast(
        t('dashboard.whatsappCampaigns.form.queued'),
    );

    const [numbers, setNumbers] = useState<string[]>([]);
    const [source, setSource] = useState('contacts');
    const [mode, setMode] = useState('text');
    const [message, setMessage] = useState('');
    const [importNote, setImportNote] = useState<ImportNote | null>(null);

    /** Adds imported numbers to whatever is already in the chip list. */
    const mergeNumbers = (incoming: string[]) => {
        const seen = new Set(numbers);
        const next = [...numbers];
        let added = 0;
        let duplicates = 0;

        incoming.forEach((number) => {
            if (seen.has(number)) {
                duplicates += 1;
                return;
            }

            seen.add(number);
            next.push(number);
            added += 1;
        });

        if (added > 0) {
            setNumbers(next);
        }

        return { added, duplicates };
    };

    const handleExtract = (result: ExtractedPhones) => {
        if (result.phones.length === 0) {
            setImportNote({
                tone: 'error',
                text: t('dashboard.whatsappCampaigns.form.noValidPhones'),
            });
            return;
        }

        const { added, duplicates } = mergeNumbers(result.phones);
        const notes = [
            t('dashboard.whatsappCampaigns.form.addedToList', {
                count: added,
            }),
        ];

        if (duplicates > 0) {
            notes.push(
                t('dashboard.whatsappCampaigns.form.alreadyListed', {
                    count: duplicates,
                }),
            );
        }

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

        setImportNote({
            tone: 'success',
            text: t('dashboard.whatsappCampaigns.form.importNote', {
                notes: notes.join(' · '),
            }),
        });
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
                className="grid max-w-3xl gap-4 rounded-xl border p-4"
            >
                {({ errors, processing }) => (
                    <>
                        <SelectField
                            key={source}
                            label={t(
                                'dashboard.whatsappCampaigns.form.recipients',
                            )}
                            name="recipient_source"
                            required
                            defaultValue={source}
                            onChange={setSource}
                            hint={t(
                                'dashboard.whatsappCampaigns.form.recipientsHint',
                            )}
                            error={errors.recipient_source}
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

                        {source === 'custom' ? (
                            <div className="grid gap-3 rounded-xl border border-dashed p-4">
                                <RecipientChipField
                                    label={t(
                                        'dashboard.whatsappCampaigns.form.numberList',
                                    )}
                                    name="custom_numbers"
                                    kind="phone"
                                    values={numbers}
                                    onChange={setNumbers}
                                    normalize={normalizePhone}
                                    placeholder="+93700123456, +93799123456"
                                    hint={t(
                                        'dashboard.whatsappCampaigns.form.numberListHint',
                                    )}
                                    error={errors.custom_numbers}
                                />
                                <ExcelPhonesImport onExtract={handleExtract} />
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

                        <SelectField
                            key={mode}
                            label={t(
                                'dashboard.whatsappCampaigns.form.messageType',
                            )}
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
                            <FieldWrapper
                                label={t(
                                    'dashboard.whatsappCampaigns.form.message',
                                )}
                                hint={t(
                                    'dashboard.whatsappCampaigns.form.messageHint',
                                )}
                                error={errors.message}
                            >
                                <RichTextEditor
                                    name="message"
                                    value={message}
                                    onChange={setMessage}
                                    allowChart={false}
                                    dir={i18n.dir() === 'rtl' ? 'rtl' : 'ltr'}
                                    placeholder={t(
                                        'dashboard.whatsappCampaigns.form.messagePlaceholder',
                                    )}
                                />
                            </FieldWrapper>
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
                                    error={errors.template_name}
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
                                    error={errors.template_language}
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
                                    error={errors.template_variables}
                                />
                            </>
                        )}

                        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            {t(
                                'dashboard.whatsappCampaigns.form.sendingNotice',
                            )}
                        </div>

                        <Button
                            className="w-fit"
                            type="submit"
                            disabled={processing}
                        >
                            {t('dashboard.whatsappCampaigns.form.send')}
                        </Button>
                    </>
                )}
            </Form>
        </DashboardPage>
    );
}
