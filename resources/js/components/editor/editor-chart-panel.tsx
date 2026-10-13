import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CHART_TYPES, type ChartDraft } from '@/components/editor/editor-utils';

interface EditorChartPanelProps {
    chart: ChartDraft;
    onChange: (next: ChartDraft) => void;
    onInsert: () => void;
}

/** Inline form for configuring and inserting a chart block. */
export default function EditorChartPanel({ chart, onChange, onInsert }: EditorChartPanelProps) {
    return (
        <div className="grid gap-2 border-b border-border bg-muted/20 p-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Type
                <select
                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                    value={chart.type}
                    onChange={(e) => onChange({ ...chart, type: e.target.value })}
                >
                    {CHART_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Title
                <Input
                    value={chart.title}
                    onChange={(e) => onChange({ ...chart, title: e.target.value })}
                    placeholder="Sales per quarter"
                />
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Labels (comma separated)
                <Input
                    value={chart.labels}
                    onChange={(e) => onChange({ ...chart, labels: e.target.value })}
                    placeholder="Q1, Q2, Q3, Q4"
                />
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Values (comma separated)
                <Input
                    value={chart.values}
                    onChange={(e) => onChange({ ...chart, values: e.target.value })}
                    placeholder="12, 19, 7, 22"
                />
            </label>
            <div className="sm:col-span-2">
                <Button type="button" size="sm" onClick={onInsert}>
                    Insert chart
                </Button>
            </div>
        </div>
    );
}
