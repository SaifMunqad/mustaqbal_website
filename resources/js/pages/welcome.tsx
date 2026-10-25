/**
 * Public home page.
 *
 * The layout is entirely authored in the page builder: every band rendered here
 * is a block an admin placed, ordered and translated, pushed through the same
 * component map the editor's own preview uses. That is what keeps the live page
 * identical to what was saved — there is no second, hard-coded home template.
 */
import PageGrid, { type RenderBlock } from '@/components/home/page-block';
import MainLayout from '@/layouts/app/main-layout';
import type { SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface WelcomeProps extends SharedData {
    blocks?: RenderBlock[];
}

function Welcome() {
    const { t, i18n } = useTranslation();
    const { blocks } = usePage<WelcomeProps>().props;

    return (
        <div className="mx-auto max-w-6xl px-4">
            <Head title={t('navigation.home')} />
            <PageGrid
                blocks={blocks ?? []}
                rtl={i18n.dir() === 'rtl' || i18n.language === 'ar'}
            />
        </div>
    );
}

// Use the layout
Welcome.layout = (page: ReactNode) => <MainLayout children={page} />;

export default Welcome;
