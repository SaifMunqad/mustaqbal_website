import ShowcaseSection, { ShowcaseGroup } from '@/components/general/showcase/showcase-section';
import MainLayout from '@/layouts/app/main-layout';
import { Head, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

function ShowcasePage() {
    const { groups } = usePage<{ groups: ShowcaseGroup[] }>().props;
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('showcase.title')} />

            <div className="space-y-4">
                <section className="rounded-3xl bg-gradient-to-r from-blue-100 to-purple-100 p-6 shadow-md md:p-10 dark:from-gray-900 dark:to-gray-800">
                    <h1 className="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
                        {t('showcase.title')}
                    </h1>
                    <p className="mt-3 max-w-3xl text-base text-slate-700 md:text-lg dark:text-slate-300">
                        {t('showcase.subtitle')}
                    </p>
                </section>

                <ShowcaseSection groups={groups} withHeading={false} />
            </div>
        </>
    );
}

ShowcasePage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default ShowcasePage;
