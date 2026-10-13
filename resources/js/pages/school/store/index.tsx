import MainLayout from '@/layouts/app/main-layout';
import BookCard from '@/components/store/book-card';
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

interface Props {
    books: { data: Book[] };
    categories: Category[];
    filters: { search: string; category: string };
    [key: string]: unknown;
}

function StoreIndexPage() {
    const { books, categories, filters } = usePage<Props>().props;
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search);

    const applyFilters = (category: string) => {
        router.get('/store', { search, category }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title={t('store.title')} />

            <div className="space-y-6">
                <section className="rounded-3xl bg-blue-50 p-6 shadow-md md:p-10 dark:bg-blue-950">
                    <h1 className="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">{t('store.title')}</h1>
                    <p className="mt-3 max-w-3xl text-base text-slate-700 dark:text-slate-300">{t('store.subtitle')}</p>
                </section>

                <div className="flex flex-wrap items-center gap-3">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && applyFilters(filters.category)}
                        placeholder={t('store.search')}
                        className="rounded-2xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-900"
                    />
                    <button
                        type="button"
                        onClick={() => applyFilters(filters.category)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
                    >
                        {t('store.searchButton')}
                    </button>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => applyFilters('')}
                            className={`rounded-full px-3 py-1 text-xs ${filters.category === '' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                        >
                            {t('store.allCategories')}
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.slug}
                                type="button"
                                onClick={() => applyFilters(category.slug)}
                                className={`rounded-full px-3 py-1 text-xs ${filters.category === category.slug ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {books.data.length === 0 ? (
                    <p className="py-10 text-center text-slate-500">{t('store.empty')}</p>
                ) : (
                    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {books.data.map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </section>
                )}
            </div>
        </>
    );
}

StoreIndexPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default StoreIndexPage;
