import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/ui/table';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface Article {
    id: number;
    title: string;
    is_published: boolean;
    published_at?: string | null;
    author?: { name: string } | null;
}

export default function DashboardArticlesIndex() {
    const { articles } = usePage<{ articles: { data: Article[] } }>().props;
    const { t } = useTranslation();

    const columns: DataTableColumn<Article>[] = [
        { key: 'id', header: '#', cell: (article) => article.id, sortValue: (article) => article.id },
        { key: 'title', header: t('dashboard.table.title'), cell: (article) => article.title, sortValue: (article) => article.title },
        {
            key: 'author',
            header: t('dashboard.table.author'),
            cell: (article) => article.author?.name ?? '-',
            sortValue: (article) => article.author?.name ?? '',
        },
        {
            key: 'published',
            header: t('dashboard.table.published'),
            cell: (article) =>
                article.is_published
                    ? t('dashboard.table.yes')
                    : t('dashboard.table.no'),
            sortValue: (article) => article.is_published,
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (article) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/articles/${article.id}`} className="text-blue-600 underline">
                        {t('dashboard.table.view')}
                    </Link>
                    <Link href={`/dashboard/articles/${article.id}/edit`} className="text-blue-600 underline">
                        {t('dashboard.table.edit')}
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

