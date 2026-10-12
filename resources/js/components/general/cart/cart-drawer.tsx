import type { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ShoppingBagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface CartItem {
    book_id: number;
    title: string;
    slug: string;
    cover_image?: string | null;
    price_afn: number;
    quantity: number;
    line_total: number;
    stock: number;
    purchasable: boolean;
}

interface Cart {
    count: number;
    total: number;
    items: CartItem[];
}

const formatMoney = (value: number) =>
    new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { cart } = usePage<SharedData>().props;
    const { t, i18n } = useTranslation();

    if (!open) {
        return null;
    }

    const items = cart?.items ?? [];

    const setQuantity = (bookId: number, quantity: number) => {
        router.put(
            '/store/cart',
            { book_id: bookId, quantity },
            { preserveScroll: true, preserveState: false },
        );
    };

    const removeItem = (bookId: number) => {
        router.delete(`/store/cart/${bookId}`, { preserveScroll: true });
    };

    return (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <aside
                dir={i18n.dir()}
                className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-gray-900"
            >
                <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('cart.title')}</h2>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <XMarkIcon className="size-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                            <ShoppingBagIcon className="size-10" />
                            <p className="text-sm">{t('cart.empty')}</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {items.map((item) => (
                                <li key={item.book_id} className="flex gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                                    {item.cover_image ? (
                                        <img src={item.cover_image} alt={item.title} className="size-16 rounded-lg object-cover" />
                                    ) : (
                                        <div className="flex size-16 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                            <ShoppingBagIcon className="size-6 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                                        <p className="text-xs text-slate-500">{formatMoney(item.price_afn)} AFN</p>
                                        {!item.purchasable ? (
                                            <p className="text-xs text-red-600">{t('cart.outOfStock')}</p>
                                        ) : null}
                                        <div className="mt-2 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(item.book_id, item.quantity - 1)}
                                                className="size-7 rounded-lg border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                                            >
                                                −
                                            </button>
                                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(item.book_id, item.quantity + 1)}
                                                className="size-7 rounded-lg border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                                            >
                                                +
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.book_id)}
                                                className="ml-auto text-xs text-red-600 underline"
                                            >
                                                {t('cart.remove')}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-300">{t('cart.subtotal')}</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">{formatMoney(cart?.total ?? 0)} AFN</span>
                    </div>
                    <button
                        type="button"
                        disabled={items.length === 0}
                        onClick={() => router.get('/store/checkout')}
                        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {t('cart.checkout')}
                    </button>
                </div>
            </aside>
        </div>
    );
}
