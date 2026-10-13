import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import ConfirmDialog from '@/components/form/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Link, router, usePage } from '@inertiajs/react';

interface CategoryRow {
    id: number;
    name: string;
    slug: string;
    books_count: number;
}

interface CategoriesIndexProps {
    categories: { data: CategoryRow[] };
    [key: string]: unknown;
}

export default function DashboardCategoriesIndex() {
    const { categories } = usePage<CategoriesIndexProps>().props;

    const remove = (id: number) => {
        router.delete(`/dashboard/categories/${id}`, { preserveScroll: true });
    };

    const columns: DataTableColumn<CategoryRow>[] = [
        { key: 'id', header: '#', cell: (row) => row.id, sortValue: (row) => row.id },
        { key: 'name', header: 'Name', cell: (row) => row.name, sortValue: (row) => row.name },
        { key: 'slug', header: 'Slug', cell: (row) => row.slug, sortValue: (row) => row.slug },
        { key: 'books', header: 'Books', cell: (row) => row.books_count, sortValue: (row) => row.books_count },
        {
            key: 'actions',
            header: 'Actions',
            cell: (row) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/categories/${row.id}/edit`} className="text-blue-600 underline">
                        Edit
                    </Link>
                    <ConfirmDialog
                        title="Delete this category?"
                        description="Its books will be kept but become uncategorized. This cannot be undone."
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
        <DashboardPage titleKey="dashboard.categories.title" createHref="/dashboard/categories/create" createLabelKey="dashboard.actions.newCategory">
            <DataTable data={categories.data} columns={columns} rowKey={(row) => row.id} defaultSort={{ key: 'id', direction: 'asc' }} />
        </DashboardPage>
    );
}
