import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Row {
    id: number;
    title: string;
    author?: string | null;
    published_year?: number | null;
    publisher?: string | null;
    has_file: boolean;
    category?: string | null;
}

interface Props {
    books: { data: Row[] };
    filters: { search: string };
    [key: string]: unknown;
}

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
        { key: 'published_year', header: 'Year', cell: (row) => row.published_year ?? '-', sortValue: (row) => row.published_year ?? 0 },
        { key: 'publisher', header: 'Publisher', cell: (row) => row.publisher ?? '-', sortValue: (row) => row.publisher ?? '' },
        { key: 'category', header: 'Category', cell: (row) => row.category ?? '-', sortValue: (row) => row.category ?? '' },
        {
            key: 'file',
            header: 'PDF',
            cell: (row) => (row.has_file ? 'Uploaded' : 'Missing'),
            sortValue: (row) => row.has_file,
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
