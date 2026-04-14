import DashboardPage from '@/components/dashboard/dashboard-page';
import { DataTable, DataTableColumn } from '@/components/table';
import { Link, usePage } from '@inertiajs/react';

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

    const columns: DataTableColumn<Post>[] = [
        { key: 'id', header: '#', cell: (post) => post.id, sortValue: (post) => post.id },
        { key: 'title', header: 'Title', cell: (post) => post.title, sortValue: (post) => post.title },
        { key: 'type', header: 'Type', cell: (post) => post.type, sortValue: (post) => post.type },
        {
            key: 'visibility',
            header: 'Visibility',
            cell: (post) => post.visibility,
            sortValue: (post) => post.visibility,
        },
        {
            key: 'author',
            header: 'Author',
            cell: (post) => post.author?.name ?? '-',
            sortValue: (post) => post.author?.name ?? '',
        },
        {
            key: 'engagement',
            header: 'Engagement',
            cell: (post) => `${post.comments_count} / ${post.likes_count}`,
            sortValue: (post) => post.comments_count + post.likes_count,
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (post) => (
                <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/posts/${post.id}`} className="text-blue-600 underline">View</Link>
                    <Link href={`/dashboard/posts/${post.id}/edit`} className="text-blue-600 underline">Edit</Link>
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

