import DocumentFrame from '@/components/editor/document-frame';
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
}

function ArticleShowPage() {
    const { article } = usePage<{ article: Article }>().props;
    const images = [article.cover_image, ...(article.images ?? [])].filter(
        (image): image is string => Boolean(image),
    );
    const copyText = [article.title, article.excerpt, article.body, ...images]
        .filter(Boolean)
        .join('\n\n');

    return (
        <>
            <Head title={article.title} />

            <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900 md:p-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <Link href="/school/articles" className="text-sm font-medium text-blue-600 underline">
                        Back to articles
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {article.published_at ?? 'Unpublished'}
                    </p>
                </div>

                <DocumentFrame
                    title={article.title}
                    description={article.excerpt ?? 'Read the full article and copy the content when needed.'}
                    body={article.body}
                    images={images}
                    copyText={copyText}
                    bodyLabel="Article body"
                >
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                            By {article.author?.name ?? 'Mustaqbal Team'}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                            {article.published_at ? 'Published' : 'Draft'}
                        </span>
                    </div>
                </DocumentFrame>
            </section>
        </>
    );
}

ArticleShowPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default ArticleShowPage;

