/**
 * Language management.
 *
 * Languages can be reordered by drag and drop, and each row exposes the active and
 * default flags. The default language cannot be deleted, and every change is
 * persisted immediately rather than through a save button.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import ConfirmDialog from '@/components/form/confirm-dialog';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { Form, router, usePage } from '@inertiajs/react';
import { GripVertical } from 'lucide-react';
import { type DragEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageRow {
    id: number;
    code: string;
    name: string;
    dir: 'ltr' | 'rtl';
    is_active: boolean;
    is_default: boolean;
    sort_order: number;
}

interface LanguagesIndexProps {
    languages: LanguageRow[];
    [key: string]: unknown;
}

const inputClass =
    'rounded-xl border border-border bg-background px-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

export default function DashboardLanguagesIndex() {
    const { t } = useTranslation();
    const { languages } = usePage<LanguagesIndexProps>().props;
    const createToast = useFormToast(
        t('dashboard.languages.created'),
        t('dashboard.formError'),
    );
    const updateToast = useFormToast(
        t('dashboard.languages.updated'),
        t('dashboard.formError'),
    );

    const [rows, setRows] = useState<LanguageRow[]>(languages);
    const dragSource = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Keep local order in sync whenever the server sends a fresh list.
    useEffect(() => {
        setRows(languages);
    }, [languages]);

    const remove = (language: LanguageRow) => {
        router.delete(`/dashboard/languages/${language.id}`, { preserveScroll: true });
    };

    const handleDragStart = (index: number) => {
        dragSource.current = index;
    };

    const handleDragOver = (event: DragEvent, index: number) => {
        event.preventDefault();
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (index: number) => {
        const sourceIndex = dragSource.current;
        setDragOverIndex(null);

        if (sourceIndex === null || sourceIndex === index) {
            return;
        }

        const next = [...rows];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(index, 0, moved);
        setRows(next);
        dragSource.current = null;

        router.put(
            '/dashboard/languages/reorder',
            { order: next.map((row) => row.id) },
            { preserveScroll: true },
        );
    };

    const handleDragEnd = () => {
        dragSource.current = null;
        setDragOverIndex(null);
    };

    return (
        <DashboardPage titleKey="dashboard.languages.title">
            <p className="max-w-3xl text-sm text-muted-foreground">{t('dashboard.languages.hint')}</p>

            <Form
                action="/dashboard/languages"
                method="post"
                onError={createToast.onError}
                className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-background p-4"
            >
                <label className="flex flex-col gap-1 text-xs font-medium">
                    {t('dashboard.languages.code')}
                    <input name="code" required placeholder={t('dashboard.languages.codePlaceholder')} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium">
                    {t('dashboard.languages.name')}
                    <input name="name" required placeholder={t('dashboard.languages.namePlaceholder')} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium">
                    {t('dashboard.languages.direction')}
                    <select name="dir" defaultValue="ltr" className={inputClass}>
                        <option value="ltr">{t('dashboard.languages.ltr')}</option>
                        <option value="rtl">{t('dashboard.languages.rtl')}</option>
                    </select>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium">
                    <input type="checkbox" name="is_active" value="1" defaultChecked />
                    {t('dashboard.languages.active')}
                </label>
                <Button type="submit">{t('dashboard.languages.add')}</Button>
            </Form>

            <p className="text-xs text-muted-foreground">{t('dashboard.languages.dragHint')}</p>

            <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-start">
                        <tr>
                            <th className="w-8 px-2 py-3" aria-label={t('dashboard.languages.dragHint')} />
                            <th className="px-4 py-3">{t('dashboard.languages.code')}</th>
                            <th className="px-4 py-3">{t('dashboard.languages.name')}</th>
                            <th className="px-4 py-3">{t('dashboard.languages.direction')}</th>
                            <th className="px-4 py-3">{t('dashboard.languages.status')}</th>
                            <th className="px-4 py-3">{t('dashboard.languages.isDefault')}</th>
                            <th className="px-4 py-3">{t('dashboard.languages.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {rows.map((language, index) => (
                            <tr
                                key={language.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(event) => handleDragOver(event, index)}
                                onDrop={() => handleDrop(index)}
                                onDragEnd={handleDragEnd}
                                className={dragOverIndex === index ? 'bg-blue-50 dark:bg-blue-950/30' : ''}
                            >
                                <td className="cursor-grab px-2 py-3 text-muted-foreground active:cursor-grabbing">
                                    <GripVertical className="h-4 w-4" />
                                </td>
                                <td className="px-4 py-3 font-mono">{language.code}</td>
                                <td className="px-4 py-3">
                                    <Form
                                        action={`/dashboard/languages/${language.id}`}
                                        method="put"
                                        onError={updateToast.onError}
                                        className="flex flex-wrap items-center gap-2"
                                    >
                                        <input name="name" defaultValue={language.name} className={inputClass} />
                                        <select name="dir" defaultValue={language.dir} className={inputClass}>
                                            <option value="ltr">{t('dashboard.languages.ltr')}</option>
                                            <option value="rtl">{t('dashboard.languages.rtl')}</option>
                                        </select>
                                        <input type="hidden" name="is_active" value={language.is_active ? '1' : '0'} />
                                        <input type="hidden" name="is_default" value={language.is_default ? '1' : '0'} />
                                        <Button type="submit" size="sm" variant="secondary">
                                            {t('dashboard.languages.update')}
                                        </Button>
                                    </Form>
                                </td>
                                <td className="px-4 py-3">{language.dir}</td>
                                <td className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.put(
                                                `/dashboard/languages/${language.id}`,
                                                {
                                                    ...language,
                                                    is_active: language.is_active ? 0 : 1,
                                                    is_default: language.is_default ? 1 : 0,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                                            language.is_active
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                        }`}
                                    >
                                        {language.is_active ? t('dashboard.languages.active') : t('dashboard.languages.inactive')}
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                                    {language.is_default ? (
                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                            {t('dashboard.languages.isDefault')}
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.put(
                                                    `/dashboard/languages/${language.id}`,
                                                    {
                                                        ...language,
                                                        is_active: language.is_active ? 1 : 0,
                                                        is_default: 1,
                                                    },
                                                    { preserveScroll: true },
                                                )
                                            }
                                            className="text-xs text-blue-600 underline"
                                        >
                                            {t('dashboard.languages.setDefault')}
                                        </button>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <ConfirmDialog
                                        title={t(
                                            'dashboard.languages.deleteTitle',
                                            {
                                                name: language.name,
                                                code: language.code,
                                            },
                                        )}
                                        description={t(
                                            'dashboard.languages.deleteDescription',
                                        )}
                                        confirmLabel={t(
                                            'dashboard.languages.delete',
                                        )}
                                        cancelLabel={t(
                                            'dashboard.languages.cancel',
                                        )}
                                        onConfirm={() => remove(language)}
                                    >
                                        <button type="button" className="text-red-600 underline">
                                            {t('dashboard.languages.delete')}
                                        </button>
                                    </ConfirmDialog>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardPage>
    );
}
