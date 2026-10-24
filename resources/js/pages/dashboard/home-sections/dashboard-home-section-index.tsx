/**
 * Home page section list.
 *
 * Order is edited locally and saved in one request (`saveOrder`), so reordering
 * several rows costs a single round trip; deletion is confirmed first.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/form/confirm-dialog';
import { EyeIcon } from '@heroicons/react/24/outline';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

interface HomeSectionsIndexProps {
    sections: SectionRow[];
    [key: string]: unknown;
}

// Remounting with a new key (whenever the server order/flags change) re-seeds
// local order state from props without a setState-in-effect cascade.
function SectionList({ sections }: { sections: SectionRow[] }) {
    const { t } = useTranslation();
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
        router.delete(`/dashboard/home-sections/${id}`, { preserveScroll: true });
    };

    if (rows.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                {t('homeBuilder.empty')}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    {t('homeBuilder.orderHint')}
                </span>
                <Button type="button" size="sm" disabled={!dirty} onClick={saveOrder}>
                    {t('homeBuilder.saveOrder')}
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
                            aria-label={t('homeBuilder.moveUp')}
                        >
                            ↑
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={index === rows.length - 1}
                            onClick={() => move(index, 1)}
                            aria-label={t('homeBuilder.moveDown')}
                        >
                            ↓
                        </Button>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {t(`enums.homeSectionType.${row.section_type}`, row.type_label)}
                            </span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    row.kind === 'curated'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                }`}
                            >
                                {row.kind === 'curated'
                                    ? t('homeBuilder.kindCurated')
                                    : t('homeBuilder.kindAuthored')}
                            </span>
                            {row.is_active ? null : (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                    {t('homeBuilder.hidden')}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 truncate text-sm font-medium">
                            {row.title || row.heading || '—'}
                        </p>
                        {row.kind === 'curated' ? (
                            <p className="text-xs text-muted-foreground">
                                {row.item_count > 0
                                    ? t('homeBuilder.itemsCount', {
                                          count: row.item_count,
                                      })
                                    : t('homeBuilder.autoLatest')}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/dashboard/home-sections/${row.id}/edit`}
                            className="text-sm font-semibold text-blue-600 underline"
                        >
                            {t('homeBuilder.edit')}
                        </Link>
                        <ConfirmDialog
                            title={t('homeBuilder.removeTitle')}
                            description={t('homeBuilder.removeDescription')}
                            confirmLabel={t('homeBuilder.delete')}
                            onConfirm={() => remove(row.id)}
                        >
                            <Button type="button" variant="link" className="text-sm font-semibold text-red-600 underline">
                                {t('homeBuilder.delete')}
                            </Button>
                        </ConfirmDialog>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function DashboardHomeSectionIndex({ sections }: HomeSectionsIndexProps) {
    const { t } = useTranslation();
    // Encoding order + flags keeps the list re-seeded after reorder/toggle saves.
    const signature = sections.map((section) => `${section.id}:${section.is_active}`).join('|');

    return (
        <DashboardPage
            titleKey="dashboard.homeSections.title"
            createHref="/dashboard/home-sections/create"
            createLabelKey="dashboard.homeSections.add"
        >
            <Link
                href="/dashboard/home-sections/visual"
                className="flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 transition hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
            >
                <span className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <EyeIcon className="size-5" />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                            {t('homeBuilder.visualEditor')}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                            {t('homeBuilder.visualEditorHint')}
                        </span>
                    </span>
                </span>
                <Button type="button" size="sm" className="shrink-0">
                    {t('homeBuilder.open')}
                </Button>
            </Link>

            <p className="text-sm text-muted-foreground">
                {t('homeBuilder.intro')}
            </p>

            <SectionList key={signature} sections={sections} />
        </DashboardPage>
    );
}
