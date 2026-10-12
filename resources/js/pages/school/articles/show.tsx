import ArticleBody from '@/components/editor/article-body';
import ShareButton from '@/components/editor/share-button';
import MainLayout from '@/layouts/app/main-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

interface Article {
    id: number;
    slug: string;
    title: string;
    excerpt?: string | null;
    body: string;
    cover_image?: string | null;
    images?: string[] | null;
    published_at?: string | null;
    author?: { name: string } | null;
    writer_name?: string | null;
}

function ArticleShowPage() {
    const { article } = usePage<{ article: Article }>().props;
    const gallery = (article.images ?? []).filter(
        (image): image is string => Boolean(image),
    );
    const byline = article.writer_name ?? article.author?.name ?? 'Mustaqbal Team';

    return (
        <>
            <Head title={article.title} />

            <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900 md:p-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <Link href="/school/articles" className="text-sm font-medium text-blue-600 underline">
                        Back to articles
                    </Link>
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {article.published_at ?? 'Unpublished'}
                        </p>
                        <ShareButton
                            url={
                                typeof window !== 'undefined'
                                    ? `${window.location.origin}/school/articles/${article.slug}`
                                    : `/school/articles/${article.slug}`
                            }
                            title={article.title}
                        />
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                        By {byline}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                        {article.published_at ? 'Published' : 'Draft'}
                    </span>
                </div>

                {article.cover_image ? (
                    <img
                        src={article.cover_image}
                        alt={article.title}
                        className="mb-6 max-h-80 w-full rounded-2xl object-cover"
                    />
                ) : null}

                {article.excerpt ? (
                    <p className="mb-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                        {article.excerpt}
                    </p>
                ) : null}

                <ArticleBody body={article.body} />

                {gallery.length ? (
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        {gallery.map((image, index) => (
                            <img
                                key={`${index}-${image}`}
                                src={image}
                                alt={`${article.title} image ${index + 1}`}
                                className="h-44 w-full rounded-2xl object-cover"
                            />
                        ))}
                    </div>
                ) : null}
            </section>
        </>
    );
}

ArticleShowPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default ArticleShowPage;
