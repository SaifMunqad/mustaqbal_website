import {
    rowInputClass,
    rowRemoveButtonClass,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { Button } from '@/components/ui/button';
import { type HomeStat } from '@/types';
import { useTranslation } from 'react-i18next';

interface HomeStatsEditorProps {
    stats: HomeStat[];
    onChange: (next: HomeStat[]) => void;
    /**
     * Optional prefix for the serialized input names. Defaults to the plain
     * `home_stats[...]` shape; per-language tabs pass `translations.<code>` so a
     * single submit carries every language's list.
     */
    namePrefix?: string;
}

/**
 * Repeatable "quick stats" editor for the home page. Each row's inputs keep the
 * `home_stats[i][...]` names (optionally prefixed via `namePrefix`) so the
 * surrounding Inertia <Form> serializes them into an array on submit; the parent
 * owns the array state via onChange.
 */
export default function HomeStatsEditor({
    stats,
    onChange,
    namePrefix = '',
}: HomeStatsEditorProps) {
    const { t } = useTranslation();
    const base = namePrefix ? `${namePrefix}.home_stats` : 'home_stats';

    const update = (index: number, key: keyof HomeStat, value: string) =>
        onChange(
            stats.map((row, i) =>
                i === index ? { ...row, [key]: value } : row,
            ),
        );

    const add = () => onChange([...stats, { value: '', label: '' }]);

    const remove = (index: number) =>
        onChange(stats.filter((_, i) => i !== index));

    return (
        <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('dashboard.settings.form.statsTitle')}
                </span>
                <Button type="button" size="sm" onClick={add}>
                    {t('dashboard.settings.form.statsAdd')}
                </Button>
            </div>
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/40 md:flex-row md:items-center md:border-transparent md:bg-transparent md:p-0 dark:md:bg-transparent"
                >
                    <input
                        className={`${rowInputClass} md:w-auto md:flex-1`}
                        name={`${base}[${index}][value]`}
                        value={stat.value}
                        onChange={(event) =>
                            update(index, 'value', event.target.value)
                        }
                        placeholder={t(
                            'dashboard.settings.form.statsValuePlaceholder',
                        )}
                    />
                    <input
                        className={`${rowInputClass} md:w-auto md:flex-1`}
                        name={`${base}[${index}][label]`}
                        value={stat.label}
                        onChange={(event) =>
                            update(index, 'label', event.target.value)
                        }
                        placeholder={t(
                            'dashboard.settings.form.statsLabelPlaceholder',
                        )}
                    />
                    <button
                        type="button"
                        className={`${rowRemoveButtonClass} text-center md:self-start`}
                        onClick={() => remove(index)}
                    >
                        {t('dashboard.form.remove')}
                    </button>
                </div>
            ))}
        </div>
    );
}
