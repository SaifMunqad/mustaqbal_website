import ExcelAwardsImport, {
    type AwardImportResult,
    type AwardImportRow,
} from '@/components/dashboard/awards/excel-awards-import';
import DashboardPage from '@/components/dashboard/dashboard-page';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AwardImportPageProps {
    maxRows: number;
    [key: string]: unknown;
}

// Canonical English headers on purpose: the column detector matches these
// regardless of the dashboard language the admin is using.
const TEMPLATE_HEADERS = ['Person ID', 'Award ID', 'Full name', 'Father name', 'Awarded on'];

export default function DashboardAwardsImport() {
    const { maxRows } = usePage<AwardImportPageProps>().props;
    const { t } = useTranslation();
    const { onError } = useFormToast(
        t('dashboard.awards.import.imported'),
        t('dashboard.awards.import.failed'),
    );
    const [result, setResult] = useState<AwardImportResult | null>(null);

    const form = useForm<{ rows: AwardImportRow[] }>({ rows: [] });

    const submit = () => {
        // `transform` runs at submission time, so the freshly parsed rows are
        // used even though they live in page state rather than form state.
        form.transform(() => ({ rows: result?.rows ?? [] }));
        form.post('/dashboard/awards/bulk', {
            preserveScroll: true,
            onError,
        });
    };

    const downloadTemplate = () => {
        const csv = `${TEMPLATE_HEADERS.join(',')}\n`;
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');

        link.href = url;
        link.download = 'awards-template.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const rows = result?.rows ?? [];
    const preview = rows.slice(0, 20);

    return (
        <DashboardPage titleKey="dashboard.awards.import.title">
            <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t('dashboard.awards.import.description')}
                </p>

                <ExcelAwardsImport maxRows={maxRows} onExtract={setResult} />

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                        {t('dashboard.awards.import.template')}
                    </Button>
                    <span className="text-xs text-slate-500">
                        {t('dashboard.awards.import.limit', { count: maxRows })}
                    </span>
                </div>

                {result && result.missingColumns.length > 0 ? (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                        {t('dashboard.awards.import.missingColumns', {
                            columns: result.missingColumns
                                .map((field) => t(`dashboard.awards.import.fields.${field}`))
                                .join(', '),
                        })}
                    </p>
                ) : null}

                {result && result.missingColumns.length === 0 ? (
                    <>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {Object.entries(result.detected).map(([field, label]) => (
                                <span
                                    key={field}
                                    className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800"
                                >
                                    {t(`dashboard.awards.import.fields.${field}`)}: {label}
                                </span>
                            ))}
                        </div>

                        <div className="space-y-1 text-sm">
                            <p className="font-medium">
                                {t('dashboard.awards.import.ready', { count: rows.length })}
                            </p>
                            {result.skippedMissingCodes > 0 ? (
                                <p className="text-amber-700 dark:text-amber-300">
                                    {t('dashboard.awards.import.skippedCodes', {
                                        count: result.skippedMissingCodes,
                                    })}
                                </p>
                            ) : null}
                            {result.skippedInvalidDate > 0 ? (
                                <p className="text-amber-700 dark:text-amber-300">
                                    {t('dashboard.awards.import.skippedDates', {
                                        count: result.skippedInvalidDate,
                                    })}
                                </p>
                            ) : null}
                            {result.skippedOverLimit > 0 ? (
                                <p className="text-amber-700 dark:text-amber-300">
                                    {t('dashboard.awards.import.skippedOverLimit', {
                                        count: result.skippedOverLimit,
                                    })}
                                </p>
                            ) : null}
                            <p className="text-xs text-slate-500">
                                {t('dashboard.awards.import.upsertNote')}
                            </p>
                        </div>

                        {preview.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-800">
                                        <tr>
                                            <th className="p-2 text-start">
                                                {t('dashboard.table.personId')}
                                            </th>
                                            <th className="p-2 text-start">
                                                {t('dashboard.table.awardId')}
                                            </th>
                                            <th className="p-2 text-start">
                                                {t('dashboard.table.fullName')}
                                            </th>
                                            <th className="p-2 text-start">
                                                {t('dashboard.table.fatherName')}
                                            </th>
                                            <th className="p-2 text-start">
                                                {t('dashboard.table.awardedAt')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, index) => (
                                            <tr key={`${row.person_id}-${row.award_id}-${index}`} className="border-t">
                                                <td className="p-2">{row.person_id}</td>
                                                <td className="p-2">{row.award_id}</td>
                                                <td className="p-2">{row.full_name || '-'}</td>
                                                <td className="p-2">{row.father_name || '-'}</td>
                                                <td className="p-2">{row.awarded_at}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}

                        {rows.length > preview.length ? (
                            <p className="text-xs text-slate-500">
                                {t('dashboard.awards.import.previewLimited', {
                                    count: preview.length,
                                })}
                            </p>
                        ) : null}

                        <Button
                            type="button"
                            disabled={form.processing || rows.length === 0}
                            onClick={submit}
                        >
                            {form.processing
                                ? t('dashboard.awards.import.submitting')
                                : t('dashboard.awards.import.submit', { count: rows.length })}
                        </Button>
                    </>
                ) : null}

                {form.progress ? (
                    <p className="text-xs text-slate-500">
                        {t('dashboard.awards.import.progress', { value: form.progress.percentage })}
                    </p>
                ) : null}
            </div>
        </DashboardPage>
    );
}
