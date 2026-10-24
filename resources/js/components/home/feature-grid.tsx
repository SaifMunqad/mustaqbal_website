import Reveal from '@/components/ui/reveal';
import { gridCols } from '@/lib/grid-cols';
import { resolveIcon } from '@/lib/icon-map';
import type { HomeFeature } from '@/types';
import { useTranslation } from 'react-i18next';

// Rotating accent tints so adjacent feature tiles read as varied, not uniform.
const ACCENTS = [
    'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
];

export default function FeatureGrid({
    features,
    heading,
    body,
    columns,
}: {
    features: HomeFeature[];
    /** Authored heading/body; blank falls back to the built-in wording. */
    heading?: string | null;
    body?: string | null;
    /** Admin-chosen track count (defaults to the four-column design). */
    columns?: number | null;
}) {
    const { t } = useTranslation();

    const items = (features ?? []).filter(
        (feature) => feature.title || feature.description,
    );

    if (items.length === 0) {
        return null;
    }

    return (
        <section className="space-y-6">
            <header className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                    {heading?.trim() || t('home.featuresTitle')}
                </h2>
                <p className="mx-auto mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
                    {body?.trim() || t('home.featuresSubtitle')}
                </p>
            </header>

            <div className={`grid gap-5 ${gridCols(columns, 4)}`}>
                {items.map((feature, index) => {
                    const Icon = resolveIcon(feature.icon);

                    return (
                        <Reveal
                            key={`${feature.title}-${index}`}
                            className="h-full"
                            delay={index * 50}
                        >
                            <article className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-gray-900">
                                <div
                                    className={`flex size-12 items-center justify-center rounded-xl ${ACCENTS[index % ACCENTS.length]}`}
                                >
                                    <Icon className="size-6" aria-hidden />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {feature.description}
                                </p>
                            </article>
                        </Reveal>
                    );
                })}
            </div>
        </section>
    );
}
