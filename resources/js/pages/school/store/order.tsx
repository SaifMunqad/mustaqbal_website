import MainLayout from '@/layouts/app/main-layout';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface OrderItem {
    title: string;
    quantity: number;
    line_total: number;
}

interface Order {
    order_number: string;
    customer_name: string;
    status?: string | null;
    payment_method?: string | null;
    total: number;
    placed_at?: string | null;
    items: OrderItem[];
}

interface Props {
    order: Order;
    [key: string]: unknown;
}

const formatMoney = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);

function OrderConfirmationPage() {
    const { order } = usePage<Props>().props;
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('order.title')} />

            <div className="mx-auto max-w-2xl space-y-6 py-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <CheckCircleIcon className="size-14 text-emerald-500" />
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('order.title')}</h1>
                    <p className="text-slate-600 dark:text-slate-300">{t('order.thanks', { name: order.customer_name })}</p>
                </div>

                <div className="space-y-4 rounded-3xl border border-border bg-white p-6 dark:bg-gray-900">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
                        <div>
                            <p className="text-xs text-slate-500">{t('order.number')}</p>
                            <p className="font-mono font-semibold text-slate-900 dark:text-white">{order.order_number}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">{t('order.status')}</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{order.status}</p>
                        </div>
                    </div>

                    <ul className="space-y-2 text-sm">
                        {order.items.map((item, index) => (
                            <li key={index} className="flex justify-between gap-2 text-slate-600 dark:text-slate-300">
                                <span>
                                    {item.quantity}× {item.title}
                                </span>
                                <span>{formatMoney(item.line_total)} AFN</span>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                        <span className="font-semibold text-slate-900 dark:text-white">{t('order.total')}</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">{formatMoney(order.total)} AFN</span>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('order.payment')}: {order.payment_method}
                    </p>
                </div>

                <div className="text-center">
                    <Link href="/store" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                        {t('order.continue')}
                    </Link>
                </div>
            </div>
        </>
    );
}

OrderConfirmationPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default OrderConfirmationPage;
