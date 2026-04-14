import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface DashboardTab {
    key: string;
    href: string;
    labelKey: string;
}

const tabs: DashboardTab[] = [
    { key: 'overview', href: '/dashboard', labelKey: 'dashboard.tabs.overview' },
    { key: 'articles', href: '/dashboard/articles', labelKey: 'dashboard.tabs.articles' },
    { key: 'posts', href: '/dashboard/posts', labelKey: 'dashboard.tabs.posts' },
    { key: 'contacts', href: '/dashboard/contacts', labelKey: 'dashboard.tabs.contacts' },
    { key: 'messages', href: '/dashboard/messages', labelKey: 'dashboard.tabs.messages' },
    { key: 'programs', href: '/dashboard/programs', labelKey: 'dashboard.tabs.programs' },
    { key: 'pages', href: '/dashboard/site-pages', labelKey: 'dashboard.tabs.pages' },
];

export default function DashboardTabs() {
    const { url } = usePage();
    const { t, i18n } = useTranslation();

    return (
        <div
            className={`flex flex-wrap gap-2 rounded-xl border border-sidebar-border/70 p-2 dark:border-sidebar-border ${
                i18n.dir() === 'rtl' ? 'justify-end' : 'justify-start'
            }`}
        >
            {tabs.map((tab) => {
                const isActive =
                    url === tab.href ||
                    (tab.href !== '/dashboard' && url.startsWith(`${tab.href}/`));

                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        className={`rounded-lg px-3 py-1.5 text-sm transition ${
                            isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {t(tab.labelKey)}
                    </Link>
                );
            })}
        </div>
    );
}

