import { type HomeStat } from '@/types';
import {
    addBtnClass,
    rowButtonClass,
    rowInputClass,
} from '@/components/dashboard/site-settings/site-settings-shared';

interface HomeStatsEditorProps {
    stats: HomeStat[];
    onChange: (next: HomeStat[]) => void;
}

/**
 * Repeatable "quick stats" editor for the home page. Each row's inputs keep the
 * `home_stats[i][...]` names so the surrounding Inertia <Form> serializes them
 * into an array on submit; the parent owns the array state via onChange.
 */
export default function HomeStatsEditor({ stats, onChange }: HomeStatsEditorProps) {
    const update = (index: number, key: keyof HomeStat, value: string) =>
        onChange(stats.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

    const add = () => onChange([...stats, { value: '', label: '' }]);

    const remove = (index: number) => onChange(stats.filter((_, i) => i !== index));

    return (
        <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Quick stats
                </span>
                <button type="button" className={addBtnClass} onClick={add}>
                    Add stat
                </button>
            </div>
            {stats.map((stat, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2">
                    <input
                        className={rowInputClass}
                        name={`home_stats[${index}][value]`}
                        value={stat.value}
                        onChange={(event) => update(index, 'value', event.target.value)}
                        placeholder="1,200+"
                    />
                    <input
                        className={rowInputClass}
                        name={`home_stats[${index}][label]`}
                        value={stat.label}
                        onChange={(event) => update(index, 'label', event.target.value)}
                        placeholder="Students"
                    />
                    <button type="button" className={rowButtonClass} onClick={() => remove(index)}>
                        Remove
                    </button>
                </div>
            ))}
        </div>
    );
}
