import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface Post {
    id: number;
    title: string;
    type: string;
    visibility: string;
    author?: { name: string } | null;
    comments_count: number;
    likes_count: number;
}

export default function DashboardPostsIndex() {
    const { posts } = usePage<{ posts: { data: Post[] } }>().props;
    const { t } = useTranslation();

    const columns: DataTableColumn<Post>[] = [
        { key: 'id', header: '#', cell: (post) => post.id, sortValue: (post) => post.id },
        { key: 'title', header: t('dashboard.table.title'), cell: (post) => post.title, sortValue: (post) => post.title },
        { key: 'type', header: t('dashboard.table.type'), cell: (post) => post.type, sortValue: (post) => post.type },
        {
            key: 'visibility',
            header: t('dashboard.table.visibility'),
            cell: (post) => post.visibility,
            sortValue: (post) => post.visibility,
        },
        {
            key: 'author',
            header: t('dashboard.table.author'),
            cell: (post) => post.author?.name ?? '-',
            sortValue: (post) => post.author?.name ?? '',
        },
        {
            key: 'engagement',
            header: t('dashboard.table.engagement'),
            cell: (post) => `${post.comments_count} / ${post.likes_count}`,
            sortValue: (post) => post.comments_count + post.likes_count,
        },
        {
            key: 'actions',
            header: t('dashboard.table.actions'),
            cell: (post) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/posts/${post.id}`} className="text-blue-600 underline">{t('dashboard.table.view')}</Link>
                    <Link href={`/dashboard/posts/${post.id}/edit`} className="text-blue-600 underline">{t('dashboard.table.edit')}</Link>
                </div>
            ),
        },
    ];

    return (
        <DashboardPage
            titleKey="dashboard.posts.title"
            createHref="/dashboard/posts/create"
            createLabelKey="dashboard.actions.newPost"
        >
            <DataTable
                data={posts.data}
                columns={columns}
                rowKey={(post) => post.id}
                defaultSort={{ key: 'id', direction: 'asc' }}
            />
        </DashboardPage>
    );
}

