import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface DashboardPageProps {
    titleKey: string;
    breadcrumbs?: BreadcrumbItem[];
    createHref?: string;
    createLabelKey?: string;
    // Optional extra header controls (e.g. a link to a related management page)
    // rendered next to the primary create button.
    actions?: ReactNode;
    children: ReactNode;
}

export default function DashboardPage({
    titleKey,
    breadcrumbs = [{ title: 'Dashboard', href: '/dashboard' }],
    createHref,
    createLabelKey,
    actions,
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
                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        {actions}
                        {createHref && createLabelKey ? (
                            <Button asChild size="sm">
                                <Link href={createHref}>{t(createLabelKey)}</Link>
                            </Button>
                        ) : null}
                    </div>
                </div>


                {children}
            </div>
        </AppLayout>
    );
}


