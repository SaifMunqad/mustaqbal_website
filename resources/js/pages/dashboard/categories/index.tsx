import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, router, usePage } from '@inertiajs/react';

interface Row {
    id: number;
    name: string;
    slug: string;
    books_count: number;
}

interface Props {
    categories: { data: Row[] };
    [key: string]: unknown;
}

export default function DashboardCategoriesIndex() {
    const { categories } = usePage<Props>().props;

    const remove = (id: number) => {
        if (window.confirm('Delete this category? Its books will be kept but become uncategorized.')) {
            router.delete(`/dashboard/categories/${id}`, { preserveScroll: true });
        }
    };

    const columns: DataTableColumn<Row>[] = [
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
                    <button type="button" onClick={() => remove(row.id)} className="text-red-600 underline">
                        Delete
                    </button>
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
