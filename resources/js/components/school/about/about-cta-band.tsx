import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export default function AboutCtaBand() {
    const { t } = useTranslation();

    return (
        <section className="overflow-hidden rounded-3xl bg-blue-700 p-8 text-center shadow-md md:p-12">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{t('about.ctaTitle')}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-blue-100">{t('about.ctaText')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                    href="/school/enroll"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                    {t('about.ctaEnroll')}
                    <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                    href="/school/contact"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"
                >
                    {t('about.ctaContact')}
                </Link>
            </div>
        </section>
    );
}
