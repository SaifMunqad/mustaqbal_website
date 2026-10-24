import {
    FEATURE_ICONS,
    rowInputClass,
    rowRemoveButtonClass,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { Button } from '@/components/ui/button';
import { type HomeFeature } from '@/types';
import { useTranslation } from 'react-i18next';

interface HomeFeaturesEditorProps {
    features: HomeFeature[];
    onChange: (next: HomeFeature[]) => void;
    /**
     * Optional prefix for the serialized input names. Defaults to the plain
     * `home_features[...]` shape; per-language tabs pass `translations.<code>`.
     */
    namePrefix?: string;
}

/**
 * Repeatable "why choose us" feature editor for the home page. Rows keep the
 * `home_features[i][...]` input names (optionally prefixed via `namePrefix`) so
 * the surrounding <Form> serializes them into an array; the parent owns the
 * array state via onChange.
 */
export default function HomeFeaturesEditor({
    features,
    onChange,
    namePrefix = '',
}: HomeFeaturesEditorProps) {
    const { t } = useTranslation();
    const base = namePrefix ? `${namePrefix}.home_features` : 'home_features';

    const update = (index: number, key: keyof HomeFeature, value: string) =>
        onChange(
            features.map((row, i) =>
                i === index ? { ...row, [key]: value } : row,
            ),
        );

    const add = () =>
        onChange([
            ...features,
            { icon: 'faculty', title: '', description: '' },
        ]);

    const remove = (index: number) =>
        onChange(features.filter((_, i) => i !== index));

    return (
        <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('dashboard.settings.form.featuresTitle')}
                </span>
                <Button type="button" size="sm" onClick={add}>
                    {t('dashboard.settings.form.featuresAdd')}
                </Button>
            </div>
            {features.map((feature, index) => (
                <div
                    key={index}
                    className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <select
                            className={`${rowInputClass} md:w-auto md:shrink-0`}
                            name={`${base}[${index}][icon]`}
                            value={feature.icon ?? 'faculty'}
                            onChange={(event) =>
                                update(index, 'icon', event.target.value)
                            }
                        >
                            {FEATURE_ICONS.map((icon) => (
                                <option key={icon.value} value={icon.value}>
                                    {t(icon.labelKey)}
                                </option>
                            ))}
                        </select>
                        <input
                            className={`${rowInputClass} md:w-auto md:flex-1`}
                            name={`${base}[${index}][title]`}
                            value={feature.title}
                            onChange={(event) =>
                                update(index, 'title', event.target.value)
                            }
                            placeholder={t(
                                'dashboard.settings.form.featureTitlePlaceholder',
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
                    <textarea
                        className={`${rowInputClass} h-16`}
                        name={`${base}[${index}][description]`}
                        value={feature.description}
                        onChange={(event) =>
                            update(index, 'description', event.target.value)
                        }
                        placeholder={t(
                            'dashboard.settings.form.featureDescriptionPlaceholder',
                        )}
                    />
                </div>
            ))}
        </div>
    );
}
