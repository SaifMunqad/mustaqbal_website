import ArticleBody from '@/components/editor/article-body';
import DashboardPage from '@/components/dashboard/dashboard-page';
import { Button } from '@/components/ui/button';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CalendarDaysIcon,
    CheckBadgeIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';

interface Article {
    id: number;
    title: string;
    excerpt?: string | null;
    body: string;
    cover_image?: string | null;
    images?: string[] | null;
    is_published: boolean;
    published_at?: string | null;
    author?: { name: string } | null;
    writer_name?: string | null;
    language?: string | null;
    language_dir?: 'rtl' | 'ltr';
}

export default function DashboardArticlesShow() {
    const { article } = usePage<{ article: Article }>().props;
    const contentDir = article.language_dir ?? 'ltr';

    return (
        <DashboardPage titleKey="dashboard.articles.title">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/articles">
                        <ArrowLeftIcon className="size-4" aria-hidden="true" />
                        Back to articles
                    </Link>
                </Button>
                <Button asChild size="sm">
                    <Link href={`/dashboard/articles/${article.id}/edit`}>
                        Edit article
                    </Link>
                </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <CheckBadgeIcon className="size-4 text-emerald-600" aria-hidden="true" />
                        Status
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {article.is_published ? 'Published' : 'Draft'}
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <UserCircleIcon className="size-4 text-blue-600" aria-hidden="true" />
                        Writer
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {article.writer_name ?? article.author?.name ?? 'Unknown author'}
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <CalendarDaysIcon className="size-4 text-amber-600" aria-hidden="true" />
                        Published
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {article.published_at ?? 'Not published yet'}
                    </p>
                </div>
            </div>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10">
                <div dir={contentDir}>
                    <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
                        {article.title}
                    </h1>
                    {article.excerpt ? (
                        <p className="mb-6 text-muted-foreground">{article.excerpt}</p>
                    ) : null}
                    <ArticleBody body={article.body} dir={contentDir} />
                </div>
            </section>
        </DashboardPage>
    );
}
