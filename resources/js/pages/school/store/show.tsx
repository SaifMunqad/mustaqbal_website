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
    isbn?: string | null;
    description?: string | null;
    price_afn: number;
    cover_image?: string | null;
    images?: string[] | null;
    stock: number;
    is_available: boolean;
    category?: string | null;
}

interface RelatedBook {
    id: number;
    title: string;
    slug: string;
    price_afn: number;
    cover_image?: string | null;
}

interface Props {
    book: Book;
    related: RelatedBook[];
    [key: string]: unknown;
}

const formatMoney = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);

function StoreShowPage() {
    const { book, related } = usePage<Props>().props;
    const { t } = useTranslation();
    const [quantity, setQuantity] = useState(1);

    const purchasable = book.is_available && book.stock > 0;
    const gallery = [book.cover_image, ...(book.images ?? [])].filter((image): image is string => Boolean(image));

    const addToCart = () => {
        router.post('/store/cart', { book_id: book.id, quantity }, { preserveScroll: true });
    };

    return (
        <>
            <Head title={book.title} />

            <div className="space-y-8">
                <Link href="/store" className="text-sm font-medium text-blue-600 underline">
                    {t('store.back')}
                </Link>

                <div className="grid gap-8 lg:grid-cols-2">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-gray-900">
                        {gallery[0] ? (
                            <img src={gallery[0]} alt={book.title} className="h-full max-h-[28rem] w-full object-cover" />
                        ) : (
                            <div className="flex h-80 items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                <ShoppingBagIcon className="size-16" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {book.category ? <span className="text-sm text-blue-600">{book.category}</span> : null}
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{book.title}</h1>
                        {book.author ? <p className="text-slate-600 dark:text-slate-300">{t('store.by')} {book.author}</p> : null}
                        {book.isbn ? <p className="text-xs text-slate-400">ISBN: {book.isbn}</p> : null}
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatMoney(book.price_afn)} AFN</p>

                        {purchasable ? (
                            <p className="text-sm text-emerald-600">{t('store.inStock', { count: book.stock })}</p>
                        ) : (
                            <p className="text-sm text-red-600">{t('store.unavailable')}</p>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <div className="flex items-center rounded-xl border border-border">
                                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                    −
                                </button>
                                <span className="w-10 text-center">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.min(book.stock || 1, q + 1))}
                                    className="px-3 py-2 text-slate-600 dark:text-slate-300"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                type="button"
                                disabled={!purchasable}
                                onClick={addToCart}
                                className="flex-1 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t('store.addToCart')}
                            </button>
                        </div>

                        {book.description ? (
                            <div className="prose prose-sm max-w-none pt-4 text-slate-700 dark:text-slate-300">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('store.description')}</h2>
                                <p className="whitespace-pre-wrap">{book.description}</p>
                            </div>
                        ) : null}
                    </div>
                </div>

                {gallery.length > 1 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {gallery.map((image, index) => (
                            <img key={`${index}-${image}`} src={image} alt={`${book.title} ${index + 1}`} className="h-32 w-full rounded-2xl object-cover" />
                        ))}
                    </div>
                ) : null}

                {related.length > 0 ? (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('store.related')}</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {related.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/store/books/${item.slug}`}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-gray-900"
                                >
                                    {item.cover_image ? (
                                        <img src={item.cover_image} alt={item.title} className="h-40 w-full object-cover" />
                                    ) : (
                                        <div className="flex h-40 items-center justify-center bg-slate-100 dark:bg-slate-800">
                                            <ShoppingBagIcon className="size-8 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="space-y-1 p-3">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(item.price_afn)} AFN</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
}

StoreShowPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default StoreShowPage;
