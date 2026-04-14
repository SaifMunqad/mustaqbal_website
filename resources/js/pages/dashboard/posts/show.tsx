import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import { Button } from '@/components/ui/button';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CalendarDaysIcon,
    ChatBubbleLeftRightIcon,
    PhotoIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';

interface Post {
    id: number;
    title: string;
    type: string;
    visibility: string;
    content: string;
    images?: string[] | null;
    scheduled_at?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    job_apply_url?: string | null;
    highlightedStudent?: { name: string } | null;
    author?: { name: string } | null;
}

export default function DashboardPostsShow() {
    const { post } = usePage<{ post: Post }>().props;
    const images = post.images ?? [];
    const copyText = [
        post.title,
        post.type,
        post.visibility,
        post.content,
        ...images,
    ]
        .filter(Boolean)
        .join('\n\n');

    return (
        <DashboardPage titleKey="dashboard.posts.title">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/posts">
                        <ArrowLeftIcon className="size-4" aria-hidden="true" />
                        Back to posts
                    </Link>
                </Button>
                <Button asChild size="sm">
                    <Link href={`/dashboard/posts/${post.id}/edit`}>
                        Edit post
                    </Link>
                </Button>
            </div>

            <DocumentFrame
                title={post.title}
                description="Post details and preview."
                body={post.content}
                images={images}
                copyText={copyText}
                bodyLabel="Post content"
            >
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <ChatBubbleLeftRightIcon className="size-4 text-blue-600" aria-hidden="true" />
                            Type / visibility
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {post.type} · {post.visibility}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <UserCircleIcon className="size-4 text-emerald-600" aria-hidden="true" />
                            Author
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {post.author?.name ?? 'Unknown author'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <PhotoIcon className="size-4 text-purple-600" aria-hidden="true" />
                            Highlighted student
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {post.highlightedStudent?.name ?? 'None'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <CalendarDaysIcon className="size-4 text-amber-600" aria-hidden="true" />
                            Schedule
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {post.scheduled_at ?? 'No schedule'}
                        </p>
                    </div>
                </div>

                {post.job_apply_url ? (
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm">
                        <span className="font-medium">Job application URL:</span>{' '}
                        <a className="text-blue-600 underline" href={post.job_apply_url} target="_blank" rel="noreferrer">
                            {post.job_apply_url}
                        </a>
                    </div>
                ) : null}

                {images.length ? (
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <PhotoIcon className="size-4 text-blue-600" aria-hidden="true" />
                            Gallery preview
                        </div>
                    </div>
                ) : null}
            </DocumentFrame>
        </DashboardPage>
    );
}


