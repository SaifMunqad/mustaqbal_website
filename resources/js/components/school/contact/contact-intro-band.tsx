import ArticleBody from '@/components/editor/article-body';
import { useTranslation } from 'react-i18next';

interface ContactIntroBandProps {
    title: string;
    intro?: string;
}

// Page intro band, consistent with the redesigned home hero.
export default function ContactIntroBand({
    title,
    intro,
}: ContactIntroBandProps) {
    const { t } = useTranslation();

    return (
        <section className="overflow-hidden rounded-3xl border border-brand-border bg-brand-soft p-6 shadow-sm md:p-10 dark:bg-brand-deep">
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
                {title}
            </h1>
            {intro ? (
                <div className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
                    <ArticleBody
                        body={intro}
                        className="text-slate-600 dark:text-slate-300"
                    />
                </div>
            ) : (
                <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-300">
                    {t('contact.paragraph')}
                </p>
            )}
        </section>
    );
}
