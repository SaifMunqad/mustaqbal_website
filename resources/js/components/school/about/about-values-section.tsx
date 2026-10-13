import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import AboutSectionHeading from '@/components/school/about/about-section-heading';
import { ACCENTS, VALUE_ICONS } from '@/components/school/about/about-constants';
import type { ValueItem } from '@/components/school/about/about-types';
import { cn } from '@/lib/utils';

export default function AboutValuesSection({ values }: { values: ValueItem[] }) {
    const { t } = useTranslation();

    return (
        <section className="space-y-8">
            <AboutSectionHeading eyebrow={t('about.valuesEyebrow')} title={t('about.valuesTitle')} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {values.map((value, index) => {
                    const Icon = VALUE_ICONS[value.icon ?? ''] ?? Sparkles;
                    return (
                        <article
                            key={`${value.title}-${index}`}
                            className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-gray-900"
                        >
                            <div className={cn('flex size-12 items-center justify-center rounded-xl', ACCENTS[index % ACCENTS.length])}>
                                <Icon className="size-6" aria-hidden />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{value.title}</h3>
                            {value.text ? <p className="text-sm text-slate-600 dark:text-slate-300">{value.text}</p> : null}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
