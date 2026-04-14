import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface DashboardPageProps {
    titleKey: string;
    breadcrumbs?: BreadcrumbItem[];
    createHref?: string;
    createLabelKey?: string;
    children: ReactNode;
}

export default function DashboardPage({
    titleKey,
    breadcrumbs = [{ title: 'Dashboard', href: '/dashboard' }],
    createHref,
    createLabelKey,
    children,
}: DashboardPageProps) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t(titleKey)} />

            <div
                dir={i18n.dir()}
                className={`space-y-4 p-4 ${isRtl ? 'text-right' : 'text-left'}`}
            >
                <div className={`flex items-center gap-2 ${isRtl ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                    <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
                    {createHref && createLabelKey ? (
                        <Link
                            href={createHref}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
                        >
                            {t(createLabelKey)}
                        </Link>
                    ) : null}
                </div>


                {children}
            </div>
        </AppLayout>
    );
}


