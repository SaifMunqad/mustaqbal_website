import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    BookOpen,
    Briefcase,
    CalendarDays,
    FileText,
    Library,
    Mail,
    MessageSquare,
    Newspaper,
    Plus,
    School,
    Users,
    type LucideIcon,
} from 'lucide-react';

interface OverviewStats {
    articles: number;
    posts: number;
    contacts: number;
    messages: number;
    programs: number;
    pages: number;
    events: number;
    enrollments: number;
    jobs: number;
    books: number;
}

interface StatCard {
    key: keyof OverviewStats;
    labelKey: string;
    icon: LucideIcon;
}

interface QuickAction {
    href: string;
    labelKey: string;
    icon: LucideIcon;
}

// Icons mirror the sidebar navigation so the dashboard feels consistent and
// makes it easy to spot which area each shortcut / metric belongs to.
const statCards: StatCard[] = [
    { key: 'articles', labelKey: 'dashboard.stats.articles', icon: Newspaper },
    { key: 'posts', labelKey: 'dashboard.stats.posts', icon: FileText },
    { key: 'events', labelKey: 'dashboard.stats.events', icon: CalendarDays },
    { key: 'books', labelKey: 'dashboard.stats.books', icon: Library },
    { key: 'programs', labelKey: 'dashboard.stats.programs', icon: School },
    { key: 'jobs', labelKey: 'dashboard.stats.jobs', icon: Briefcase },
    { key: 'pages', labelKey: 'dashboard.stats.pages', icon: BookOpen },
    { key: 'contacts', labelKey: 'dashboard.stats.contacts', icon: Mail },
    { key: 'messages', labelKey: 'dashboard.stats.messages', icon: MessageSquare },
    { key: 'enrollments', labelKey: 'dashboard.stats.enrollments', icon: Users },
];

const quickActions: QuickAction[] = [
    { href: '/dashboard/articles/create', labelKey: 'dashboard.actions.newArticle', icon: Newspaper },
    { href: '/dashboard/posts/create', labelKey: 'dashboard.actions.newPost', icon: FileText },
    { href: '/dashboard/events/create', labelKey: 'dashboard.actions.newEvent', icon: CalendarDays },
    { href: '/dashboard/books/create', labelKey: 'dashboard.actions.newBook', icon: Library },
    { href: '/dashboard/programs/create', labelKey: 'dashboard.actions.newProgram', icon: School },
    { href: '/dashboard/jobs/create', labelKey: 'dashboard.actions.newJob', icon: Briefcase },
];

export default function Dashboard() {
    const { t, i18n } = useTranslation();
    const { stats } = usePage<{ stats: OverviewStats }>().props;
    const isRtl = i18n.dir() === 'rtl';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard.title'), href: '/dashboard' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboard.title')} />

            <div
                dir={i18n.dir()}
                className={`space-y-6 p-4 ${isRtl ? 'text-right' : 'text-left'}`}
            >
                <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>

                <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {statCards.map(({ key, labelKey, icon: Icon }) => (
                        <div
                            key={key}
                            className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                                <Icon className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm text-slate-500">{t(labelKey)}</p>
                                <p className="text-2xl font-bold leading-tight">{stats[key]}</p>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="rounded-xl border bg-card p-5">
                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <h2 className="text-lg font-semibold">{t('dashboard.quickActions')}</h2>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {quickActions.map(({ href, labelKey, icon: Icon }) => (
                            <Button key={href} asChild variant="outline" className="justify-start gap-3 py-7">
                                <Link href={href} >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                                        <Icon className="size-5" />
                                    </span>
                                    <span className="flex-1 text-left rtl:text-right">{t(labelKey)}</span>
                                    <Plus className="size-4 text-slate-400" />
                                </Link>
                            </Button>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
