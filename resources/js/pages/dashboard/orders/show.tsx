import DashboardPage from '@/components/dashboard/dashboard-page';
import { Form, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

interface OrderItem {
    title: string;
    author?: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
}

interface Option {
    value: string;
    label: string;
}

interface OrderDetail {
    id: number;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string | null;
    notes?: string | null;
    status: string;
    status_label: string;
    payment_method: string;
    payment_status: string;
    total: number;
    placed_at: string;
    items: OrderItem[];
}

interface Props {
    order: OrderDetail;
    allowedTransitions: Option[];
    [key: string]: unknown;
}

const formatMoney = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);

export default function DashboardOrdersShow() {
    const { order, allowedTransitions } = usePage<Props>().props;
    const [target, setTarget] = useState(allowedTransitions[0]?.value ?? '');

    return (
        <DashboardPage titleKey="dashboard.orders.showTitle" breadcrumbs={[{ title: 'Orders', href: '/dashboard/orders' }]}>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <h2 className="mb-3 text-lg font-semibold">{order.order_number}</h2>
                        <table className="w-full text-sm">
                            <thead className="text-left text-slate-500">
                                <tr>
                                    <th className="py-2">Book</th>
                                    <th className="py-2">Qty</th>
                                    <th className="py-2">Unit</th>
                                    <th className="py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, index) => (
                                    <tr key={index} className="border-t border-border">
                                        <td className="py-2">
                                            {item.title}
                                            {item.author ? <span className="block text-xs text-slate-500">{item.author}</span> : null}
                                        </td>
                                        <td className="py-2">{item.quantity}</td>
                                        <td className="py-2">{formatMoney(item.unit_price)}</td>
                                        <td className="py-2 text-right">{formatMoney(item.line_total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-border font-semibold">
                                    <td className="py-2" colSpan={3}>
                                        Total
                                    </td>
                                    <td className="py-2 text-right">{formatMoney(order.total)} AFN</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <h3 className="mb-2 font-semibold">Customer</h3>
                        <dl className="space-y-1 text-sm">
                            <div className="flex justify-between gap-2">
                                <dt className="text-slate-500">Name</dt>
                                <dd>{order.customer_name}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                                <dt className="text-slate-500">Email</dt>
                                <dd className="truncate">{order.customer_email}</dd>
                            </div>
                            {order.customer_phone ? (
                                <div className="flex justify-between gap-2">
                                    <dt className="text-slate-500">Phone</dt>
                                    <dd>{order.customer_phone}</dd>
                                </div>
                            ) : null}
                        </dl>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4">
                        <h3 className="mb-2 font-semibold">Status</h3>
                        <dl className="mb-3 space-y-1 text-sm">
                            <div className="flex justify-between gap-2">
                                <dt className="text-slate-500">Current</dt>
                                <dd>{order.status_label}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                                <dt className="text-slate-500">Payment</dt>
                                <dd>{order.payment_method}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                                <dt className="text-slate-500">Paid</dt>
                                <dd>{order.payment_status}</dd>
                            </div>
                        </dl>

                        {allowedTransitions.length > 0 ? (
                            <Form action={`/dashboard/orders/${order.id}`} method="put" className="space-y-2">
                                {({ errors, processing }) => (
                                    <>
                                        <select value={target} onChange={(event) => setTarget(event.target.value)} className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none">
                                            {allowedTransitions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <input type="hidden" name="status" value={target} />
                                        {errors.status ? <p className="text-sm text-red-600">{errors.status}</p> : null}
                                        <button type="submit" disabled={processing} className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700 disabled:opacity-50">
                                            Update status
                                        </button>
                                    </>
                                )}
                            </Form>
                        ) : (
                            <p className="text-sm text-slate-500">No further status changes are allowed.</p>
                        )}
                    </div>

                    {order.notes ? (
                        <div className="rounded-2xl border border-border bg-background p-4">
                            <h3 className="mb-2 font-semibold">Notes</h3>
                            <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{order.notes}</p>
                        </div>
                    ) : null}

                    <Link href="/dashboard/orders" className="inline-block text-sm text-blue-600 underline">
                        Back to orders
                    </Link>
                </div>
            </div>
        </DashboardPage>
    );
}
