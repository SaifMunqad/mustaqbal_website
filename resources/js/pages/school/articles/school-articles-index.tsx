/**
 * Public article listing with infinite scroll.
 *
 * The first page arrives as a prop; further pages are fetched by
 * `useInfinitePagination` as the sentinel scrolls into view.
 */
import HomeCardItem, {
    shapeForSeed,
    type HomeCard,
} from '@/components/home/home-card-item';
import InfiniteScrollFooter from '@/components/ui/infinite-scroll-footer';
import Reveal from '@/components/ui/reveal';
import { useInfinitePagination } from '@/hooks/use-infinite-pagination';
import MainLayout from '@/layouts/app/main-layout';
import type { Paginated } from '@/types';
import { Head, usePage } from '@inertiajs/react';
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
    language_dir?: string | null;
    author?: {
        name: string;
    } | null;
}

function SchoolArticlesIndex() {
    const { articles } = usePage<{
        articles: Paginated<Article>;
    }>().props;
    const { t } = useTranslation();
    const { items, sentinelRef, loading, hasMore, error, loadMore } =
        useInfinitePagination(articles, { prop: 'articles' });

    return (
        <>
            <Head title={t('articles.title')} />

            {/* Content sits directly on the frozen page background: an extra
                tinted panel here would swallow the cards. */}
            <section className="p-6 md:p-10">
                <Reveal direction="fade" defaultInView>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {t('articles.title')}
                    </h1>
                </Reveal>

                {/* Multi-column (masonry) flow: keeps the 1/2/3 column counts and
                    the cycling card shapes, but stacks each column tightly so a
                    short landscape card never leaves a hole beside a tall one. */}
                {items.length === 0 ? (
                    <p className="mt-6 text-sm text-slate-500">
                        {t('articles.empty')}
                    </p>
                ) : (
                    <>
                        <div className="mt-6 columns-1 gap-5 md:columns-2 lg:columns-3">
                            {items.map((article, index) => {
                                const card: HomeCard = {
                                    id: article.id,
                                    title: article.title,
                                    subtitle: article.author?.name ?? null,
                                    excerpt: article.excerpt ?? null,
                                    image:
                                        article.cover_image ??
                                        article.images?.[0] ??
                                        null,
                                    url: `/school/articles/${article.slug}`,
                                    date: article.published_at ?? null,
                                    dir: article.language_dir ?? null,
                                };

                                return (
                                    // The plain wrapper owns the column break rules;
                                    // the animated Reveal stays inside it so its
                                    // transform never interferes with fragmentation.
                                    <div
                                        key={card.id}
                                        className="mb-5 break-inside-avoid"
                                    >
                                        {/* Column flow puts later indices at the top
                                            of the next columns, so cap the stagger
                                            instead of using index * step. */}
                                        <Reveal delay={Math.min(index, 3) * 40}>
                                            <HomeCardItem
                                                card={card}
                                                shapeClass={shapeForSeed(
                                                    article.id,
                                                )}
                                            />
                                        </Reveal>
                                    </div>
                                );
                            })}
                        </div>

                        <InfiniteScrollFooter
                            sentinelRef={sentinelRef}
                            loading={loading}
                            hasMore={hasMore}
                            error={error}
                            onLoadMore={loadMore}
                            showEnd={articles.last_page > 1}
                        />
                    </>
                )}
            </section>
        </>
    );
}

SchoolArticlesIndex.layout = (page: ReactNode) => (
    <MainLayout children={page} />
);

export default SchoolArticlesIndex;
