import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, usePage } from '@inertiajs/react';

interface SitePage {
    id: number;
    slug: string;
    title: string;
    is_published: boolean;
}

export default function DashboardSitePagesIndex() {
    const { pages } = usePage<{ pages: { data: SitePage[] } }>().props;

    const columns: DataTableColumn<SitePage>[] = [
        { key: 'id', header: '#', cell: (page) => page.id, sortValue: (page) => page.id },
        { key: 'slug', header: 'Slug', cell: (page) => page.slug, sortValue: (page) => page.slug },
        { key: 'title', header: 'Title', cell: (page) => page.title, sortValue: (page) => page.title },
        {
            key: 'published',
            header: 'Published',
            cell: (page) => (page.is_published ? 'Yes' : 'No'),
            sortValue: (page) => page.is_published,
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (page) => (
                <Link href={`/dashboard/site-pages/${page.id}/edit`} className="text-blue-600 underline">Edit</Link>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.pages.title"
            createHref="/dashboard/site-pages/create"
            createLabelKey="dashboard.actions.newPage"
        >
            <DataTable
                data={pages.data}
                columns={columns}
                rowKey={(page) => page.id}
                defaultSort={{ key: 'id', direction: 'asc' }}
            />
        </DashboardPage>
    );
}

