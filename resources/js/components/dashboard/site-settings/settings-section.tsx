import {
    SECTION_COPY,
    type SettingsSectionKey,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { Form } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingsSectionProps {
    section: SettingsSectionKey;
    /** Only the active panel is visible; the rest stay mounted to keep drafts. */
    active: boolean;
    dirty: boolean;
    /** Called after a successful save so the section can re-baseline. */
    onSaved: () => void;
    children: (slot: {
        errors: Record<string, string>;
        processing: boolean;
    }) => ReactNode;
}

/**
 * One save scope of the settings page: its own form, its own submit button and
 * its own error summary. Submitting posts just this section's fields (the hidden
 * `section` input tells the controller what to validate), so a broken URL in the
 * social section can never block a branding change.
 */
export default function SettingsSection({
    section,
    active,
    dirty,
    onSaved,
    children,
}: SettingsSectionProps) {
    const { t } = useTranslation();
    // Success feedback comes from the server flash; this only surfaces failures.
    const { onError } = useFormToast(t('dashboard.settings.updated'));
    const copy = SECTION_COPY[section];

    // Validation errors are shared page props, so every mounted section sees the
    // last failed submit. Keep them locally to only surface this section's.
    const [failures, setFailures] = useState<Record<string, string>>({});

    const handleError = (errors: Record<string, string>) => {
        setFailures(errors);
        onError(errors);

        // The summary sits at the top of the panel; the admin may have scrolled
        // to the footer to submit.
        document
            .getElementById(`settings-panel-${section}`)
            ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };

    return (
        <section
            id={`settings-panel-${section}`}
            role="tabpanel"
            aria-labelledby={`settings-tab-${section}`}
            hidden={!active}
            className="scroll-mt-24"
        >
            <div className="rounded-xl border border-border bg-card p-4">
                <header className="mb-4 border-b border-border pb-3">
                    <h2 className="text-lg font-semibold">
                        {t(copy.titleKey)}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t(copy.descriptionKey)}
                    </p>
                </header>

                <Form
                    action="/dashboard/site-settings"
                    method="put"
                    options={{ preserveScroll: true }}
                    disableWhileProcessing
                    // Drop the failure summary as soon as the admin edits again.
                    onInput={() => {
                        if (Object.keys(failures).length > 0) {
                            setFailures({});
                        }
                    }}
                    onSuccess={() => {
                        setFailures({});
                        onSaved();
                    }}
                    onError={handleError}
                    className="grid gap-4"
                >
                    {({ errors, processing, recentlySuccessful }) => (
                        <>
                            <input
                                type="hidden"
                                name="section"
                                value={section}
                            />

                            <ErrorSummary errors={failures} />

                            {children({ errors, processing })}

                            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                                <SaveStatus
                                    dirty={dirty}
                                    processing={processing}
                                    saved={recentlySuccessful && !dirty}
                                />
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? t('dashboard.settings.form.saving')
                                        : t(
                                              'dashboard.settings.form.saveSection',
                                          )}
                                </Button>
                            </footer>
                        </>
                    )}
                </Form>
            </div>
        </section>
    );
}

function SaveStatus({
    dirty,
    processing,
    saved,
}: {
    dirty: boolean;
    processing: boolean;
    saved: boolean;
}) {
    const { t } = useTranslation();

    if (processing) {
        return (
            <span className="text-sm text-muted-foreground">
                {t('dashboard.settings.form.saving')}
            </span>
        );
    }

    if (saved) {
        return (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
                {t('dashboard.settings.form.saved')}
            </span>
        );
    }

    if (dirty) {
        return (
            <span className="text-sm text-amber-600 dark:text-amber-400">
                {t('dashboard.settings.form.unsaved')}
            </span>
        );
    }

    return <span className="text-sm text-muted-foreground" />;
}

/**
 * Server-side errors grouped at the top of the section: repeatable rows and
 * nested translation keys have no inline slot, so their messages would otherwise
 * be invisible after a failed save.
 */
function ErrorSummary({ errors }: { errors: Record<string, string> }) {
    const { t } = useTranslation();
    const messages = [...new Set(Object.values(errors))];

    if (messages.length === 0) {
        return null;
    }

    return (
        <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
            <p className="font-medium">
                {t('dashboard.settings.form.errorsHeading')}
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
                {messages.map((message) => (
                    <li key={message}>{message}</li>
                ))}
            </ul>
        </div>
    );
}
