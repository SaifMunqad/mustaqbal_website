import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CHART_TYPES, type ChartDraft } from '@/components/editor/editor-utils';
import { useTranslation } from 'react-i18next';

interface EditorChartPanelProps {
    chart: ChartDraft;
    onChange: (next: ChartDraft) => void;
    onInsert: () => void;
}

/** Inline form for configuring and inserting a chart block. */
export default function EditorChartPanel({ chart, onChange, onInsert }: EditorChartPanelProps) {
    const { t } = useTranslation();

    return (
        <div className="grid gap-2 border-b border-border bg-muted/20 p-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                {t('editor.chartType')}
                <select
                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                    value={chart.type}
                    onChange={(e) => onChange({ ...chart, type: e.target.value })}
                >
                    {CHART_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                            {t(
                                `editor.chartTypes.${option.value}`,
                                option.label,
                            )}
                        </option>
                    ))}
                </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                {t('editor.chartTitle')}
                <Input
                    value={chart.title}
                    onChange={(e) => onChange({ ...chart, title: e.target.value })}
                    placeholder={t('editor.chartTitlePlaceholder')}
                />
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                {t('editor.chartLabels')}
                <Input
                    value={chart.labels}
                    onChange={(e) => onChange({ ...chart, labels: e.target.value })}
                    placeholder={t('editor.chartLabelsPlaceholder')}
                />
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                {t('editor.chartValues')}
                <Input
                    value={chart.values}
                    onChange={(e) => onChange({ ...chart, values: e.target.value })}
                    placeholder={t('editor.chartValuesPlaceholder')}
                />
            </label>
            <div className="sm:col-span-2">
                <Button type="button" size="sm" onClick={onInsert}>
                    {t('editor.chartInsert')}
                </Button>
            </div>
        </div>
    );
}
