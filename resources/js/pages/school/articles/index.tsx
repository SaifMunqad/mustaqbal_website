import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '@/layouts/app/main-layout';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Article {
    id: number;
    slug: string;
    title: string;
    excerpt?: string | null;
    cover_image?: string | null;
    images?: string[] | null;
    published_at?: string | null;
    author?: {
        name: string;
    } | null;
}

function ArticlesPage() {
    const { articles } = usePage<{
        articles: {
            data: Article[];
        };
    }>().props;
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('articles.title')} />

            <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900 md:p-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {t('articles.title')}
                </h1>

                <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {articles.data.map((article) => (
                        <Link
                            key={article.id}
                            href={`/school/articles/${article.slug}`}
                            className="overflow-hidden rounded-2xl border border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700"
                        >
                            {(article.cover_image ?? article.images?.[0]) ? (
                                <img
                                    src={article.cover_image ?? article.images?.[0] ?? ''}
                                    alt={article.title}
                                    className="h-40 w-full object-cover"
                                />
                            ) : null}
                            <div className="space-y-2 p-4">
                                <h2 className="text-lg font-semibold">{article.title}</h2>
                                {article.excerpt ? (
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {article.excerpt}
                                    </p>
                                ) : null}
                                <p className="text-xs text-slate-500">
                                    {article.author?.name ?? t('articles.defaultAuthor')}
                                </p>
                                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                    {t('articles.readArticle')}
                                </span>
                            </div>
                        </Link>
                    ))}
                    {articles.data.length === 0 ? (
                        <p className="text-sm text-slate-500">{t('articles.empty')}</p>
                    ) : null}
                </div>
            </section>
        </>
    );
}

ArticlesPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default ArticlesPage;

