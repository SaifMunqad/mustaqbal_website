import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/layouts/app/main-layout';
import { ReactNode } from 'react';

function Admissions() {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('navigation.admissions')} />

            <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900 md:p-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {t('admissions.title')}
                </h1>
                <p className="mt-4 text-slate-700 dark:text-slate-300">
                    {t('admissions.paragraph')}
                </p>
            </section>
        </>
    );
}

Admissions.layout = (page: ReactNode) => <MainLayout children={page} />;

export default Admissions;

