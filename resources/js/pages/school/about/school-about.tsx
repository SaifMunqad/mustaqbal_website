/**
 * Public About page.
 *
 * The whole page is composed in the page builder: the hero, story, mission and
 * vision, stats, value cards, highlights, leadership message and FAQ are all
 * ordinary blocks the admin orders and translates there. They render through the
 * same component map the editor preview uses, so the live page matches the saved
 * layout exactly.
 */
import PageGrid, { type RenderBlock } from '@/components/home/page-block';
import MainLayout from '@/layouts/app/main-layout';
import type { SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface AboutPageProps extends SharedData {
    title?: string;
    blocks?: RenderBlock[];
}

function SchoolAbout() {
    const { t, i18n } = useTranslation();
    const { title, site, blocks } = usePage<AboutPageProps>().props;

    // The builder hero owns the heading; the published page title is the SEO
    // fallback until an admin authors one.
    const heroTitle = (blocks ?? []).find((block) => block.component === 'hero')
        ?.hero?.title;
    const heading = heroTitle || title || site?.brand_name || t('about.title');

    return (
        <div className="mx-auto max-w-6xl px-4">
            <Head title={heading} />
            <PageGrid
                blocks={blocks ?? []}
                rtl={i18n.dir() === 'rtl' || i18n.language === 'ar'}
            />
        </div>
    );
}

SchoolAbout.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolAbout;
