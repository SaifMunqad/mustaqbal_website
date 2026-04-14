import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import { Button } from '@/components/ui/button';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CalendarDaysIcon,
    CheckBadgeIcon,
    PhotoIcon,
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
}

export default function DashboardArticlesShow() {
    const { article } = usePage<{ article: Article }>().props;
    const images = [article.cover_image, ...(article.images ?? [])].filter(
        (image): image is string => Boolean(image),
    );
    const copyText = [article.title, article.excerpt, article.body, ...images]
        .filter(Boolean)
        .join('\n\n');

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

            <DocumentFrame
                title={article.title}
                description={article.excerpt ?? 'Article details and preview.'}
                body={article.body}
                images={images}
                copyText={copyText}
                bodyLabel="Article body"
            >
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
                            Author
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {article.author?.name ?? 'Unknown author'}
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

                {images.length ? (
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <PhotoIcon className="size-4 text-blue-600" aria-hidden="true" />
                            Gallery preview
                        </div>
                    </div>
                ) : null}
            </DocumentFrame>
        </DashboardPage>
    );
}

