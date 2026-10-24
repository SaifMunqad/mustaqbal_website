/**
 * Grid of school highlights (accreditations, facilities, achievements) authored
 * in the About page content.
 */
import AboutSectionHeading from '@/components/school/about/about-section-heading';
import type { Highlight } from '@/components/school/about/about-types';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AboutHighlightsSection({
    highlights,
}: {
    highlights: Highlight[];
}) {
    const { t } = useTranslation();

    return (
        <section className="space-y-8">
            <AboutSectionHeading
                eyebrow={t('about.highlightsEyebrow')}
                title={t('about.highlightsTitle')}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((item, index) => (
                    <div
                        key={`${item.title}-${index}`}
                        className="flex items-start gap-3 rounded-2xl border border-brand-border bg-brand-soft p-5 shadow-sm"
                    >
                        <CheckCircle2
                            className="mt-0.5 size-5 shrink-0 text-emerald-500"
                            aria-hidden
                        />
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                {item.title}
                            </h3>
                            {item.text ? (
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    {item.text}
                                </p>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
