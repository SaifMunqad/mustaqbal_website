import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';
import posts from '@/routes/dashboard/posts';
import { useState } from 'react';

interface UserOption {
    id: number;
    name: string;
    role: string;
}

interface Post {
    id: number;
    user_id: number;
    title: string;
    type: string;
    visibility: string;
    content: string;
    images?: string[] | null;
    highlighted_student_id?: number | null;
    scheduled_at?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    job_apply_url?: string | null;
}

const toDateTimeInput = (value?: string | null): string => {
    if (!value) return '';
    return value.slice(0, 16);
};

export default function DashboardPostsEdit() {
    const { users, post } = usePage<{ users: UserOption[]; post: Post }>().props;
    const [content, setContent] = useState(post.content);
    const [images, setImages] = useState<string[]>(post.images?.length ? post.images : ['']);
    const { onError } = useFormToast('Post updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.posts.editTitle">
            <Form {...posts.update.form(post.id)} onError={onError} className="space-y-4">
                <DocumentFrame
                    title="Post editor"
                    description="Make changes to the post while previewing the final layout in the same workspace."
                    body={content}
                    onBodyChange={setContent}
                    bodyName="content"
                    images={images}
                    onImagesChange={setImages}
                    bodyLabel="Post content"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <select name="user_id" required className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" defaultValue={String(post.user_id)}>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                            ))}
                        </select>
                        <select name="type" required className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" defaultValue={post.type}>
                            <option value="news">News</option>
                            <option value="job">Job</option>
                            <option value="event">Event</option>
                            <option value="achievement">Achievement</option>
                            <option value="student_of_week">Student of Week</option>
                            <option value="student_of_month">Student of Month</option>
                        </select>
                        <select name="visibility" required className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" defaultValue={post.visibility}>
                            <option value="community">Community</option>
                            <option value="public">Public</option>
                        </select>
                        <select name="highlighted_student_id" className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" defaultValue={post.highlighted_student_id ? String(post.highlighted_student_id) : ''}>
                            <option value="">No highlighted student</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                        <input name="title" required defaultValue={post.title} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:col-span-2" />
                        <input name="job_apply_url" defaultValue={post.job_apply_url ?? ''} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                        <input name="scheduled_at" type="datetime-local" defaultValue={toDateTimeInput(post.scheduled_at)} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                        <input name="starts_at" type="datetime-local" defaultValue={toDateTimeInput(post.starts_at)} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                        <input name="ends_at" type="datetime-local" defaultValue={toDateTimeInput(post.ends_at)} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                </DocumentFrame>

                <button className="w-fit rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700" type="submit">Update post</button>
            </Form>
        </DashboardPage>
    );
}

