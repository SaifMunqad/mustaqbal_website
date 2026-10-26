/**
 * Language management.
 *
 * New languages are picked from a searchable catalog (the code, name and text
 * direction come from the catalog entry, and a picked language is saved active
 * immediately — there is nothing to type and no flag to tick).
 * Languages can be reordered by drag and drop, and each row exposes the active
 * and default flags. The default language cannot be deleted, and every change is
 * persisted immediately rather than through a save button.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { useFormToast } from '@/components/feedback/use-form-toast';
import ConfirmDialog from '@/components/form/confirm-dialog';
import SearchableSelectField, {
    type SearchableSelectOption,
} from '@/components/form/searchable-select-field';
import { Button } from '@/components/ui/button';
import { Form, router, usePage } from '@inertiajs/react';
import { GripVertical } from 'lucide-react';
import { type DragEvent, useEffect, useMemo, useRef, useState } from 'react';
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

interface LanguageOption {
    code: string;
    name: string;
    native: string;
    dir: 'ltr' | 'rtl';
}

interface LanguagesIndexProps {
    languages: LanguageRow[];
    languageOptions: LanguageOption[];
    [key: string]: unknown;
}

export default function DashboardLanguagesIndex() {
    const { t } = useTranslation();
    const { languages, languageOptions } = usePage<LanguagesIndexProps>().props;
    const createToast = useFormToast(
        t('dashboard.languages.created'),
        t('dashboard.formError'),
    );

    const [rows, setRows] = useState<LanguageRow[]>(languages);
    const dragSource = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [selectedLanguage, setSelectedLanguage] =
        useState<SearchableSelectOption | null>(null);

    // The catalog entries already configured as languages are filtered out by
    // the server; each option shows the native name plus the direction that will
    // be filled in, and offers the code as a search token and a row badge.
    const pickerOptions: SearchableSelectOption[] = useMemo(
        () =>
            languageOptions.map((language) => ({
                value: language.code,
                label: language.name,
                description: `${language.native} · ${t(
                    `dashboard.languages.${language.dir}`,
                )}`,
                badge: language.code,
            })),
        [languageOptions, t],
    );

    // Keep local order in sync whenever the server sends a fresh list.
    useEffect(() => {
        setRows(languages);
    }, [languages]);

    const remove = (language: LanguageRow) => {
        router.delete(`/dashboard/languages/${language.id}`, {
            preserveScroll: true,
        });
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
            <p className="max-w-3xl text-sm text-muted-foreground">
                {t('dashboard.languages.hint')}
            </p>

            <Form
                action="/dashboard/languages"
                method="post"
                onError={createToast.onError}
                onSuccess={() => setSelectedLanguage(null)}
                className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-background p-4"
            >
                <SearchableSelectField
                    label={t('dashboard.languages.name')}
                    name="code"
                    options={pickerOptions}
                    value={selectedLanguage?.value ?? ''}
                    onChange={setSelectedLanguage}
                    placeholder={t('dashboard.languages.selectLanguage')}
                    searchPlaceholder={t('dashboard.languages.searchLanguage')}
                    emptyLabel={t('dashboard.languages.noLanguageFound')}
                    className="min-w-72 flex-1"
                />
                <Button type="submit" disabled={selectedLanguage === null}>
                    {t('dashboard.languages.add')}
                </Button>
            </Form>

            <div className="space-y-1 text-xs text-muted-foreground">
                <p>{t('dashboard.languages.selectLanguageHint')}</p>
                <p>{t('dashboard.languages.dragHint')}</p>
            </div>

            <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-start">
                        <tr>
                            <th
                                className="w-8 px-2 py-3"
                                aria-label={t('dashboard.languages.dragHint')}
                            />
                            <th className="px-4 py-3">
                                {t('dashboard.languages.code')}
                            </th>
                            <th className="px-4 py-3">
                                {t('dashboard.languages.name')}
                            </th>
                            <th className="px-4 py-3">
                                {t('dashboard.languages.direction')}
                            </th>
                            <th className="px-4 py-3">
                                {t('dashboard.languages.status')}
                            </th>
                            <th className="px-4 py-3">
                                {t('dashboard.languages.isDefault')}
                            </th>
                            <th className="px-4 py-3">
                                {t('dashboard.languages.actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {rows.map((language, index) => (
                            <tr
                                key={language.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(event) =>
                                    handleDragOver(event, index)
                                }
                                onDrop={() => handleDrop(index)}
                                onDragEnd={handleDragEnd}
                                className={
                                    dragOverIndex === index
                                        ? 'bg-blue-50 dark:bg-blue-950/30'
                                        : ''
                                }
                            >
                                <td className="cursor-grab px-2 py-3 text-muted-foreground active:cursor-grabbing">
                                    <GripVertical className="h-4 w-4" />
                                </td>
                                <td className="px-4 py-3 font-mono">
                                    {language.code}
                                </td>
                                <td className="px-4 py-3">{language.name}</td>
                                <td className="px-4 py-3 font-mono text-xs uppercase">
                                    {language.dir}
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.put(
                                                `/dashboard/languages/${language.id}`,
                                                {
                                                    ...language,
                                                    is_active:
                                                        language.is_active
                                                            ? 0
                                                            : 1,
                                                    is_default:
                                                        language.is_default
                                                            ? 1
                                                            : 0,
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
                                        {language.is_active
                                            ? t('dashboard.languages.active')
                                            : t('dashboard.languages.inactive')}
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
                                                        is_active:
                                                            language.is_active
                                                                ? 1
                                                                : 0,
                                                        is_default: 1,
                                                    },
                                                    { preserveScroll: true },
                                                )
                                            }
                                            className="text-xs text-blue-600 underline"
                                        >
                                            {t(
                                                'dashboard.languages.setDefault',
                                            )}
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
                                        <button
                                            type="button"
                                            className="text-red-600 underline"
                                        >
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
