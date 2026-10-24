import ShowcaseSection, {
    ShowcaseGroup,
} from '@/components/general/showcase/showcase-section';
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import { Head, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

function SchoolShowcase() {
    const { groups } = usePage<{ groups: ShowcaseGroup[] }>().props;
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('showcase.title')} />

            <div className="space-y-4">
                <Reveal direction="fade" defaultInView>
                    <section className="rounded-3xl bg-brand-soft p-6 shadow-md md:p-10 dark:bg-brand-deep">
                        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
                            {t('showcase.title')}
                        </h1>
                        <p className="mt-3 max-w-3xl text-base text-slate-700 md:text-lg dark:text-slate-300">
                            {t('showcase.subtitle')}
                        </p>
                    </section>
                </Reveal>

                <Reveal>
                    <ShowcaseSection
                        groups={groups}
                        withHeading={false}
                        filterable
                    />
                </Reveal>
            </div>
        </>
    );
}

SchoolShowcase.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolShowcase;
