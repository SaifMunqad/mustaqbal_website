import { type HomeFeature } from '@/types';
import {
    addBtnClass,
    FEATURE_ICONS,
    rowButtonClass,
    rowInputClass,
} from '@/components/dashboard/site-settings/site-settings-shared';

interface HomeFeaturesEditorProps {
    features: HomeFeature[];
    onChange: (next: HomeFeature[]) => void;
}

/**
 * Repeatable "why choose us" feature editor for the home page. Rows keep the
 * `home_features[i][...]` input names so the surrounding <Form> serializes them
 * into an array; the parent owns the array state via onChange.
 */
export default function HomeFeaturesEditor({ features, onChange }: HomeFeaturesEditorProps) {
    const update = (index: number, key: keyof HomeFeature, value: string) =>
        onChange(features.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

    const add = () =>
        onChange([...features, { icon: 'faculty', title: '', description: '' }]);

    const remove = (index: number) => onChange(features.filter((_, i) => i !== index));

    return (
        <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Why choose us (features)
                </span>
                <button type="button" className={addBtnClass} onClick={add}>
                    Add feature
                </button>
            </div>
            {features.map((feature, index) => (
                <div
                    key={index}
                    className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            className={rowInputClass}
                            name={`home_features[${index}][icon]`}
                            value={feature.icon ?? 'faculty'}
                            onChange={(event) => update(index, 'icon', event.target.value)}
                        >
                            {FEATURE_ICONS.map((icon) => (
                                <option key={icon.value} value={icon.value}>
                                    {icon.label}
                                </option>
                            ))}
                        </select>
                        <input
                            className={rowInputClass}
                            name={`home_features[${index}][title]`}
                            value={feature.title}
                            onChange={(event) => update(index, 'title', event.target.value)}
                            placeholder="Feature title"
                        />
                        <button type="button" className={rowButtonClass} onClick={() => remove(index)}>
                            Remove
                        </button>
                    </div>
                    <textarea
                        className={`${rowInputClass} h-16`}
                        name={`home_features[${index}][description]`}
                        value={feature.description}
                        onChange={(event) => update(index, 'description', event.target.value)}
                        placeholder="Short description"
                    />
                </div>
            ))}
        </div>
    );
}
