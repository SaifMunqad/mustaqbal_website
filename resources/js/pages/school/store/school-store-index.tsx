/**
 * Bookstore listing with category filtering and infinite scroll. Selecting a
 * category re-requests the first page through the router.
 */
import BookCard from '@/components/store/book-card';
import InfiniteScrollFooter from '@/components/ui/infinite-scroll-footer';
import Reveal from '@/components/ui/reveal';
import { useInfinitePagination } from '@/hooks/use-infinite-pagination';
import MainLayout from '@/layouts/app/main-layout';
import type { Paginated } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Book {
    id: number;
    title: string;
    slug: string;
    author?: string | null;
    published_year?: number | null;
    publisher?: string | null;
    thumbnail?: string | null;
    downloadable: boolean;
    download_url?: string | null;
    category?: string | null;
}

interface Category {
    slug: string;
    name: string;
}

interface SchoolStoreIndexProps {
    books: Paginated<Book>;
    categories: Category[];
    filters: { search: string; category: string };
    [key: string]: unknown;
}

function SchoolStoreIndex() {
    const { books, categories, filters } =
        usePage<SchoolStoreIndexProps>().props;
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search);
    const { items, sentinelRef, loading, hasMore, error, loadMore } =
        useInfinitePagination(books, {
            prop: 'books',
            // A new search/category replaces the whole result set.
            resetKey: `${filters.search}|${filters.category}`,
        });

    const applyFilters = (category: string) => {
        router.get(
            '/store',
            { search, category },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title={t('store.title')} />

            <div className="space-y-6">
                <Reveal direction="fade" defaultInView>
                    <section className="rounded-3xl bg-brand-soft p-6 shadow-md md:p-10 dark:bg-brand-deep">
                        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
                            {t('store.title')}
                        </h1>
                        <p className="mt-3 max-w-3xl text-base text-slate-700 dark:text-slate-300">
                            {t('store.subtitle')}
                        </p>
                    </section>
                </Reveal>

                <div className="flex flex-wrap items-center gap-3">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) =>
                            event.key === 'Enter' &&
                            applyFilters(filters.category)
                        }
                        placeholder={t('store.search')}
                        className="rounded-2xl border border-border bg-app-bg px-3 py-2 text-sm transition outline-none focus:border-brand-border focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                        type="button"
                        onClick={() => applyFilters(filters.category)}
                        className="rounded-xl bg-brand px-4 py-2 text-sm text-brand-fg transition hover:bg-brand-hover"
                    >
                        {t('store.searchButton')}
                    </button>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => applyFilters('')}
                            className={`rounded-full px-3 py-1 text-xs ${filters.category === '' ? 'bg-brand text-brand-fg' : 'bg-brand-soft text-slate-700 dark:text-slate-200'}`}
                        >
                            {t('store.allCategories')}
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.slug}
                                type="button"
                                onClick={() => applyFilters(category.slug)}
                                className={`rounded-full px-3 py-1 text-xs ${filters.category === category.slug ? 'bg-brand text-brand-fg' : 'bg-brand-soft text-slate-700 dark:text-slate-200'}`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {items.length === 0 ? (
                    <p className="py-10 text-center text-slate-500">
                        {t('store.empty')}
                    </p>
                ) : (
                    <>
                        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {items.map((book, index) => (
                                <Reveal key={book.id} delay={index * 40}>
                                    <BookCard book={book} />
                                </Reveal>
                            ))}
                        </section>

                        <InfiniteScrollFooter
                            sentinelRef={sentinelRef}
                            loading={loading}
                            hasMore={hasMore}
                            error={error}
                            onLoadMore={loadMore}
                            showEnd={books.last_page > 1}
                        />
                    </>
                )}
            </div>
        </>
    );
}

SchoolStoreIndex.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolStoreIndex;
