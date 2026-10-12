import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Row {
    id: number;
    title: string;
    author?: string | null;
    price_afn: number;
    stock: number;
    is_available: boolean;
    category?: string | null;
}

interface Props {
    books: { data: Row[] };
    filters: { search: string };
    [key: string]: unknown;
}

const formatMoney = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);

export default function DashboardBooksIndex() {
    const { books, filters } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search);

    const remove = (id: number) => {
        if (window.confirm('Delete this book?')) {
            router.delete(`/dashboard/books/${id}`, { preserveScroll: true });
        }
    };

    const columns: DataTableColumn<Row>[] = [
        { key: 'id', header: '#', cell: (row) => row.id, sortValue: (row) => row.id },
        { key: 'title', header: 'Title', cell: (row) => row.title, sortValue: (row) => row.title },
        { key: 'author', header: 'Author', cell: (row) => row.author ?? '-', sortValue: (row) => row.author ?? '' },
        { key: 'category', header: 'Category', cell: (row) => row.category ?? '-', sortValue: (row) => row.category ?? '' },
        { key: 'price', header: 'Price', cell: (row) => `${formatMoney(row.price_afn)} AFN`, sortValue: (row) => row.price_afn },
        { key: 'stock', header: 'Stock', cell: (row) => row.stock, sortValue: (row) => row.stock },
        {
            key: 'available',
            header: 'Available',
            cell: (row) => (row.is_available && row.stock > 0 ? 'Yes' : 'No'),
            sortValue: (row) => row.is_available && row.stock > 0,
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (row) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/books/${row.id}/edit`} className="text-blue-600 underline">
                        Edit
                    </Link>
                    <button type="button" onClick={() => remove(row.id)} className="text-red-600 underline">
                        Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <DashboardPage titleKey="dashboard.books.title" createHref="/dashboard/books/create" createLabelKey="dashboard.actions.newBook">
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-3">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && router.get('/dashboard/books', { search }, { preserveState: true, replace: true })}
                    placeholder="Search books"
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                    type="button"
                    onClick={() => router.get('/dashboard/books', { search }, { preserveState: true, replace: true })}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
                >
                    Filter
                </button>
            </div>

            <DataTable data={books.data} columns={columns} rowKey={(row) => row.id} defaultSort={{ key: 'id', direction: 'asc' }} />
        </DashboardPage>
    );
}
