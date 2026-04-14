import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, usePage } from '@inertiajs/react';

interface Article {
    id: number;
    title: string;
    is_published: boolean;
    published_at?: string | null;
    author?: { name: string } | null;
}

export default function DashboardArticlesIndex() {
    const { articles } = usePage<{ articles: { data: Article[] } }>().props;

    const columns: DataTableColumn<Article>[] = [
        { key: 'id', header: '#', cell: (article) => article.id, sortValue: (article) => article.id },
        { key: 'title', header: 'Title', cell: (article) => article.title, sortValue: (article) => article.title },
        {
            key: 'author',
            header: 'Author',
            cell: (article) => article.author?.name ?? '-',
            sortValue: (article) => article.author?.name ?? '',
        },
        {
            key: 'published',
            header: 'Published',
            cell: (article) => (article.is_published ? 'Yes' : 'No'),
            sortValue: (article) => article.is_published,
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (article) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/articles/${article.id}`} className="text-blue-600 underline">
                        View
                    </Link>
                    <Link href={`/dashboard/articles/${article.id}/edit`} className="text-blue-600 underline">
                        Edit
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.articles.title"
            createHref="/dashboard/articles/create"
            createLabelKey="dashboard.actions.newArticle"
        >
            <DataTable
                data={articles.data}
                columns={columns}
                rowKey={(article) => article.id}
                defaultSort={{ key: 'id', direction: 'asc' }}
            />
        </DashboardPage>
    );
}

