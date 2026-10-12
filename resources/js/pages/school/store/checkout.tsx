import { TextField, TextAreaField, SelectField } from '@/components/form-fields';
import MainLayout from '@/layouts/app/main-layout';
import type { SharedData } from '@/types';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface PaymentOption {
    value: string;
    label: string;
}

interface Props {
    paymentMethods: PaymentOption[];
    [key: string]: unknown;
}

const formatMoney = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);

function CheckoutPage() {
    const { paymentMethods, auth, cart } = usePage<Props & { auth?: SharedData['auth']; cart?: SharedData['cart'] }>().props;
    const { t } = useTranslation();

    const items = cart?.items ?? [];
    const total = cart?.total ?? 0;

    return (
        <>
            <Head title={t('checkout.title')} />

            <div className="space-y-6">
                <Link href="/store" className="text-sm font-medium text-blue-600 underline">
                    {t('store.back')}
                </Link>

                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('checkout.title')}</h1>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Form action="/store/checkout" method="post" className="space-y-4">
                            {({ errors, processing }) => (
                                <div className="space-y-4 rounded-3xl border border-border bg-white p-6 dark:bg-gray-900">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('checkout.details')}</h2>
                                    <TextField
                                        label={t('checkout.name')}
                                        name="name"
                                        required
                                        defaultValue={auth?.user?.name ?? ''}
                                        error={errors.name}
                                    />
                                    <TextField
                                        label={t('checkout.email')}
                                        name="email"
                                        type="email"
                                        required
                                        defaultValue={auth?.user?.email ?? ''}
                                        error={errors.email}
                                    />
                                    <TextField label={t('checkout.phone')} name="phone" error={errors.phone} />
                                    <SelectField
                                        label={t('checkout.payment')}
                                        name="payment_method"
                                        required
                                        error={errors.payment_method}
                                        options={paymentMethods}
                                    />
                                    <TextAreaField label={t('checkout.notes')} name="notes" rows={3} error={errors.notes} />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('checkout.paymentHint')}</p>
                                    <button
                                        type="submit"
                                        disabled={processing || items.length === 0}
                                        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {t('checkout.placeOrder')}
                                    </button>
                                </div>
                            )}
                        </Form>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-border bg-white p-6 dark:bg-gray-900">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('checkout.summary')}</h2>
                        <ul className="space-y-2 text-sm">
                            {items.map((item) => (
                                <li key={item.book_id} className="flex justify-between gap-2 text-slate-600 dark:text-slate-300">
                                    <span className="truncate">
                                        {item.quantity}× {item.title}
                                    </span>
                                    <span className="shrink-0">{formatMoney(item.line_total)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                            <span className="font-semibold text-slate-900 dark:text-white">{t('cart.subtotal')}</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{formatMoney(total)} AFN</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

CheckoutPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default CheckoutPage;
