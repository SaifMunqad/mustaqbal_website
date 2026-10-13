import DashboardPage from '@/components/dashboard/dashboard-page';
import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface SectionRow {
    id: number;
    section_type: string;
    type_label: string;
    kind: 'curated' | 'authored';
    title: string | null;
    is_active: boolean;
    item_count: number;
    heading: string | null;
}

interface Props {
    sections: SectionRow[];
    [key: string]: unknown;
}

// Remounting with a new key (whenever the server order/flags change) re-seeds
// local order state from props without a setState-in-effect cascade.
function SectionList({ sections }: { sections: SectionRow[] }) {
    const [rows, setRows] = useState<SectionRow[]>(sections);
    const [dirty, setDirty] = useState(false);

    const move = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= rows.length) {
            return;
        }
        const next = [...rows];
        [next[index], next[target]] = [next[target], next[index]];
        setRows(next);
        setDirty(true);
    };

    const saveOrder = () => {
        router.put(
            '/dashboard/home-sections/reorder',
            { order: rows.map((row) => row.id) },
            { preserveScroll: true },
        );
    };

    const remove = (id: number) => {
        if (window.confirm('Remove this section from the home page?')) {
            router.delete(`/dashboard/home-sections/${id}`, { preserveScroll: true });
        }
    };

    if (rows.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No home page sections yet. Click “Add section” to feature content.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    Order controls what visitors see first.
                </span>
                <Button type="button" size="sm" disabled={!dirty} onClick={saveOrder}>
                    Save order
                </Button>
            </div>

            {rows.map((row, index) => (
                <div
                    key={row.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                    <div className="flex flex-col gap-1">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={index === 0}
                            onClick={() => move(index, -1)}
                            aria-label="Move up"
                        >
                            ↑
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={index === rows.length - 1}
                            onClick={() => move(index, 1)}
                            aria-label="Move down"
                        >
                            ↓
                        </Button>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {row.type_label}
                            </span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    row.kind === 'curated'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                }`}
                            >
                                {row.kind}
                            </span>
                            {row.is_active ? null : (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                    Hidden
                                </span>
                            )}
                        </div>
                        <p className="mt-1 truncate text-sm font-medium">
                            {row.title || row.heading || '—'}
                        </p>
                        {row.kind === 'curated' ? (
                            <p className="text-xs text-muted-foreground">
                                {row.item_count > 0
                                    ? `${row.item_count} specific item(s)`
                                    : 'Auto: latest'}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/dashboard/home-sections/${row.id}/edit`}
                            className="text-sm font-semibold text-blue-600 underline"
                        >
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={() => remove(row.id)}
                            className="text-sm font-semibold text-red-600 underline"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function DashboardHomeSectionIndex({ sections }: Props) {
    // Encoding order + flags keeps the list re-seeded after reorder/toggle saves.
    const signature = sections.map((section) => `${section.id}:${section.is_active}`).join('|');

    return (
        <DashboardPage
            titleKey="dashboard.homeSections.title"
            createHref="/dashboard/home-sections/create"
            createLabelKey="dashboard.homeSections.add"
        >
            <p className="text-sm text-muted-foreground">
                Arrange the blocks shown on the public home page. Curated blocks pull
                live content; home-only blocks are authored here. With no active blocks,
                the home page falls back to recognition highlights.
            </p>

            <SectionList key={signature} sections={sections} />
        </DashboardPage>
    );
}
