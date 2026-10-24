/**
 * Book listing with filtering, per-row deletion and the entry point to category
 * management.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import ResourceFilterBar from '@/components/dashboard/resource-filter-bar';
import { DataTable, DataTableColumn } from '@/components/ui/table';
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
        { key: 'title', header: t('dashboard.table.title'), cell: (row) => row.title, sortValue: (row) => row.title },
        { key: 'author', header: t('dashboard.table.author'), cell: (row) => row.author ?? '-', sortValue: (row) => row.author ?? '' },
        { key: 'published_year', header: t('dashboard.table.year'), cell: (row) => row.published_year ?? '-', sortValue: (row) => row.published_year ?? 0 },
        { key: 'publisher', header: t('dashboard.table.publisher'), cell: (row) => row.publisher ?? '-', sortValue: (row) => row.publisher ?? '' },
        { key: 'category', header: t('dashboard.table.category'), cell: (row) => row.category ?? '-', sortValue: (row) => row.category ?? '' },
        {
            key: 'file',
            header: t('dashboard.table.pdf'),
            cell: (row) =>
                row.has_file
                    ? t('dashboard.table.uploaded')
                    : t('dashboard.table.missing'),
            sortValue: (row) => row.has_file,
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (row) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/books/${row.id}/edit`} className="text-blue-600 underline">
                        {t('dashboard.table.edit')}
                    </Link>
                    <ConfirmDialog
                        title={t('dashboard.books.form.deleteTitle')}
                        description={t('dashboard.books.form.deleteDescription')}
                        confirmLabel={t('dashboard.form.delete')}
                        onConfirm={() => remove(row.id)}
                    >
                        <Button type="button" variant="destructive">
                            {t('dashboard.form.delete')}
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
                placeholder={t('dashboard.table.searchBooks')}
            />

            <DataTable data={books.data} columns={columns} rowKey={(row) => row.id} defaultSort={{ key: 'id', direction: 'asc' }} />
        </DashboardPage>
    );
}
