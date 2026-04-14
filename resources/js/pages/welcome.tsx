import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/layouts/app/main-layout';
import { ReactNode } from 'react';

function Welcome() {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('navigation.home')} />

            <section className="rounded-3xl bg-gradient-to-r from-blue-100 to-purple-100 p-6 shadow-md md:p-10 dark:from-gray-900 dark:to-gray-800">
                <h1 className="text-3xl font-bold text-slate-900 md:text-5xl dark:text-white">
                    {t('home.title')}
                </h1>
                <p className="mt-4 max-w-3xl text-base text-slate-700 md:text-lg dark:text-slate-300">
                    {t('home.subtitle')}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/school/programs"
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        {t('home.ctaPrimary')}
                    </Link>
                    <Link
                        href="/school/contact"
                        className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white/60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-gray-800/60"
                    >
                        {t('home.ctaSecondary')}
                    </Link>
                </div>
            </section>
        </>
    );
}

// Use the layout
Welcome.layout = (page: ReactNode) => <MainLayout children={page} />;

export default Welcome;
