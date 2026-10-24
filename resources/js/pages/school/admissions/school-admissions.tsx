/**
 * Static admissions information page: a single translated introduction to the
 * admissions process, wrapped in the shared public layout.
 */
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

function SchoolAdmissions() {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('navigation.admissions')} />

            <Reveal direction="fade" defaultInView>
                <section className="rounded-3xl bg-brand-soft p-6 shadow-sm md:p-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {t('admissions.title')}
                    </h1>
                    <p className="mt-4 text-slate-700 dark:text-slate-300">
                        {t('admissions.paragraph')}
                    </p>
                </section>
            </Reveal>
        </>
    );
}

SchoolAdmissions.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolAdmissions;
