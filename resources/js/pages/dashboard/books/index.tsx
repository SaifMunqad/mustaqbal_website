import DashboardPage from '@/components/dashboard/dashboard-page';
import ResourceFilterBar from '@/components/dashboard/resource-filter-bar';
import { DataTable, DataTableColumn } from '@/components/table';
import ConfirmDialog from '@/components/form/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Folder } from 'lucide-react';

interface BookRow {
    id: number;
    title: string;
    author?: string | null;
    published_year?: number | null;
    publisher?: string | null;
    has_file: boolean;
    category?: string | null;
}

interface BooksIndexProps {
    books: { data: BookRow[] };
    filters: { search: string };
    [key: string]: unknown;
}

export default function DashboardBooksIndex() {
    const { books, filters } = usePage<BooksIndexProps>().props;
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search);

    const applyFilters = () =>
        router.get('/dashboard/books', { search }, { preserveState: true, replace: true });

    const remove = (id: number) =>
        router.delete(`/dashboard/books/${id}`, { preserveScroll: true });

    const columns: DataTableColumn<BookRow>[] = [
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
                    <ConfirmDialog
                        title="Delete this book?"
                        description="The book and its downloads will be removed. This cannot be undone."
                        confirmLabel="Delete"
                        onConfirm={() => remove(row.id)}
                    >
                        <Button type="button" variant="destructive">
                            Delete
                        </Button>
                    </ConfirmDialog>
                </div>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.books.title"
            createHref="/dashboard/books/create"
            createLabelKey="dashboard.actions.newBook"
            actions={
                <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/categories">
                        <Folder className="size-4" />
                        {t('dashboard.tabs.categories')}
                    </Link>
                </Button>
            }
        >
            <ResourceFilterBar
                search={search}
                onSearchChange={setSearch}
                onApply={applyFilters}
                placeholder="Search books"
            />

            <DataTable data={books.data} columns={columns} rowKey={(row) => row.id} defaultSort={{ key: 'id', direction: 'asc' }} />
        </DashboardPage>
    );
}
