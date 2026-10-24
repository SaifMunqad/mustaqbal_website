import AboutSectionHeading from '@/components/school/about/about-section-heading';
import type { FaqItem } from '@/components/school/about/about-types';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AboutFaqSection({ faqs }: { faqs: FaqItem[] }) {
    const { t } = useTranslation();

    return (
        <section className="space-y-8">
            <AboutSectionHeading
                eyebrow={t('about.faqEyebrow')}
                title={t('about.faqTitle')}
            />
            <div className="mx-auto max-w-3xl space-y-3">
                {faqs.map((faq, index) => (
                    <details
                        key={`${faq.question}-${index}`}
                        className="group rounded-2xl border border-brand-border bg-brand-soft p-5 shadow-sm"
                    >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white">
                            {faq.question}
                            <ChevronDown
                                className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180"
                                aria-hidden
                            />
                        </summary>
                        {faq.answer ? (
                            <p className="mt-3 text-slate-600 dark:text-slate-300">
                                {faq.answer}
                            </p>
                        ) : null}
                    </details>
                ))}
            </div>
        </section>
    );
}
