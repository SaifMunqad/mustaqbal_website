import MainLayout from '@/layouts/app/main-layout';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Book {
    id: number;
    title: string;
    slug: string;
    author?: string | null;
    price_afn: number;
    cover_image?: string | null;
    stock: number;
    is_available: boolean;
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

const formatMoney = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);

function StoreIndexPage() {
    const { books, categories, filters } = usePage<Props>().props;
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search);

    const applyFilters = (category: string) => {
        router.get('/store', { search, category }, { preserveState: true, replace: true });
    };

    const addToCart = (bookId: number) => {
        router.post('/store/cart', { book_id: bookId, quantity: 1 }, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('store.title')} />

            <div className="space-y-6">
                <section className="rounded-3xl bg-gradient-to-r from-blue-100 to-purple-100 p-6 shadow-md md:p-10 dark:from-gray-900 dark:to-gray-800">
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
                            <div
                                key={book.id}
                                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-gray-900"
                            >
                                <Link href={`/store/books/${book.slug}`} className="block">
                                    {book.cover_image ? (
                                        <img src={book.cover_image} alt={book.title} className="h-48 w-full object-cover" />
                                    ) : (
                                        <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                            <ShoppingBagIcon className="size-10" />
                                        </div>
                                    )}
                                </Link>
                                <div className="flex flex-1 flex-col gap-1 p-4">
                                    {book.category ? <span className="text-xs text-blue-600">{book.category}</span> : null}
                                    <Link href={`/store/books/${book.slug}`} className="font-semibold text-slate-900 hover:underline dark:text-white">
                                        {book.title}
                                    </Link>
                                    {book.author ? <p className="text-xs text-slate-500">{book.author}</p> : null}
                                    <div className="mt-auto flex items-center justify-between pt-3">
                                        <span className="font-bold text-slate-900 dark:text-white">{formatMoney(book.price_afn)} AFN</span>
                                        <button
                                            type="button"
                                            disabled={!book.is_available || book.stock <= 0}
                                            onClick={() => addToCart(book.id)}
                                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {book.is_available && book.stock > 0 ? t('store.addToCart') : t('store.unavailable')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>
                )}
            </div>
        </>
    );
}

StoreIndexPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default StoreIndexPage;
