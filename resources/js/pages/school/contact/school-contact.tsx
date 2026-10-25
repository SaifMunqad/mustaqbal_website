/**
 * Public contact page.
 *
 * The page is composed in the page builder — intro hero, inquiry form, the Site
 * Settings contact column and the location map are ordinary blocks the admin
 * orders and translates there. The form block owns its own success state, so the
 * page itself only lays the blocks out.
 */
import PageGrid, { type RenderBlock } from '@/components/home/page-block';
import MainLayout from '@/layouts/app/main-layout';
import type { SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ContactPageProps extends SharedData {
    title?: string;
    blocks?: RenderBlock[];
}

function SchoolContact() {
    const { t, i18n } = useTranslation();
    const { title, blocks } = usePage<ContactPageProps>().props;

    // The builder hero owns the heading; the published page title is the SEO
    // fallback until an admin authors one.
    const heroTitle = (blocks ?? []).find((block) => block.component === 'hero')
        ?.hero?.title;
    const heading = heroTitle || title || t('contact.title');

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

SchoolContact.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolContact;
