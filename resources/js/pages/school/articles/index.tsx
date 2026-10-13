import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/layouts/app/main-layout';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import HomeCardItem, { shapeForIndex, type HomeCard } from '@/components/home/home-card-item';

interface Article {
    id: number;
    slug: string;
    title: string;
    excerpt?: string | null;
    cover_image?: string | null;
    images?: string[] | null;
    published_at?: string | null;
    language_dir?: string | null;
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

                <div className="mt-6 grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {articles.data.map((article, index) => {
                        const card: HomeCard = {
                            id: article.id,
                            title: article.title,
                            subtitle: article.author?.name ?? null,
                            excerpt: article.excerpt ?? null,
                            image: article.cover_image ?? article.images?.[0] ?? null,
                            url: `/school/articles/${article.slug}`,
                            date: article.published_at ?? null,
                            dir: article.language_dir ?? null,
                        };

                        return <HomeCardItem key={card.id} card={card} shapeClass={shapeForIndex(index)} />;
                    })}
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

