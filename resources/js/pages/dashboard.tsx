import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface OverviewStats {
    articles: number;
    posts: number;
    contacts: number;
    messages: number;
    programs: number;
    pages: number;
}

export default function Dashboard() {
    const { t, i18n } = useTranslation();
    const { stats } = usePage<{ stats: OverviewStats }>().props;
    const isRtl = i18n.dir() === 'rtl';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboard.title')} />

            <div
                dir={i18n.dir()}
                className={`space-y-5 p-4 ${isRtl ? 'text-right' : 'text-left'}`}
            >
                <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>


                <section className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border p-4">
                        <p className="text-sm text-slate-500">{t('dashboard.stats.articles')}</p>
                        <p className="text-2xl font-bold">{stats.articles}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-sm text-slate-500">{t('dashboard.stats.posts')}</p>
                        <p className="text-2xl font-bold">{stats.posts}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-sm text-slate-500">{t('dashboard.stats.contacts')}</p>
                        <p className="text-2xl font-bold">{stats.contacts}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-sm text-slate-500">{t('dashboard.stats.messages')}</p>
                        <p className="text-2xl font-bold">{stats.messages}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-sm text-slate-500">{t('dashboard.stats.programs')}</p>
                        <p className="text-2xl font-bold">{stats.programs}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-sm text-slate-500">{t('dashboard.stats.pages')}</p>
                        <p className="text-2xl font-bold">{stats.pages}</p>
                    </div>
                </section>

                <section className="rounded-xl border p-4">
                    <h2 className="text-lg font-semibold">{t('dashboard.quickActions')}</h2>
                    <div className={`mt-3 flex flex-wrap gap-2 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                        <Link href="/dashboard/articles/create" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white">{t('dashboard.actions.newArticle')}</Link>
                        <Link href="/dashboard/posts/create" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white">{t('dashboard.actions.newPost')}</Link>
                        <Link href="/dashboard/programs/create" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white">{t('dashboard.actions.newProgram')}</Link>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
