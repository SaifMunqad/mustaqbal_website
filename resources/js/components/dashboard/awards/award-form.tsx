import ConfirmDialog from '@/components/form/confirm-dialog';
import { DateField, TextField } from '@/components/form/form-fields';
import { Button } from '@/components/ui/button';
import { Form, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export interface AwardRecord {
    id: number;
    person_id: string;
    award_id: string;
    full_name: string;
    father_name?: string | null;
    awarded_at?: string | null;
}

interface AwardFormProps {
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
    toastOnError: (errors: Record<string, string>) => void;
    // Present on edit; absent on create so fields render empty.
    award?: AwardRecord;
    deleteUrl?: string;
}

/**
 * Shared create/edit form for a single award record. Awards are
 * language-neutral (codes and names are stored exactly as issued), so there is
 * no translation editor here — unlike books, articles or jobs.
 */
export default function AwardForm({
    action,
    method,
    submitLabel,
    toastOnError,
    award,
    deleteUrl,
}: AwardFormProps) {
    const { t } = useTranslation();
    const isEdit = Boolean(award);

    const removeAward = () => {
        if (!deleteUrl) {
            return;
        }

        router.delete(deleteUrl, {
            onSuccess: () => router.visit('/dashboard/awards'),
        });
    };

    return (
        <Form action={action} method={method} onError={toastOnError} className="space-y-4">
            {({ errors, processing }) => (
                <div className="grid gap-4 rounded-2xl border border-border bg-background p-4 md:grid-cols-2">
                    <TextField
                        label={t('dashboard.awards.form.personId')}
                        name="person_id"
                        required
                        defaultValue={award?.person_id ?? ''}
                        placeholder={t('dashboard.awards.form.personIdPlaceholder')}
                        hint={t('dashboard.awards.form.personIdHint')}
                        error={errors.person_id}
                    />
                    <TextField
                        label={t('dashboard.awards.form.awardId')}
                        name="award_id"
                        required
                        defaultValue={award?.award_id ?? ''}
                        placeholder={t('dashboard.awards.form.awardIdPlaceholder')}
                        hint={t('dashboard.awards.form.awardIdHint')}
                        error={errors.award_id}
                    />
                    <TextField
                        label={t('dashboard.awards.form.fullName')}
                        name="full_name"
                        required
                        defaultValue={award?.full_name ?? ''}
                        placeholder={t('dashboard.awards.form.fullNamePlaceholder')}
                        error={errors.full_name}
                    />
                    <TextField
                        label={t('dashboard.awards.form.fatherName')}
                        name="father_name"
                        defaultValue={award?.father_name ?? ''}
                        placeholder={t('dashboard.awards.form.fatherNamePlaceholder')}
                        error={errors.father_name}
                    />
                    <DateField
                        label={t('dashboard.awards.form.awardedAt')}
                        name="awarded_at"
                        required
                        value={award?.awarded_at ?? null}
                        hint={t('dashboard.awards.form.awardedAtHint')}
                        error={errors.awarded_at}
                    />

                    <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                        <Button type="submit" disabled={processing}>
                            {submitLabel}
                        </Button>
                        {isEdit && deleteUrl ? (
                            <ConfirmDialog
                                title={t('dashboard.awards.deleteTitle')}
                                description={t('dashboard.awards.deleteDescription')}
                                confirmLabel={t('dashboard.form.delete')}
                                onConfirm={removeAward}
                            >
                                <Button type="button" variant="destructive">
                                    {t('dashboard.awards.form.delete')}
                                </Button>
                            </ConfirmDialog>
                        ) : null}
                    </div>
                </div>
            )}
        </Form>
    );
}
