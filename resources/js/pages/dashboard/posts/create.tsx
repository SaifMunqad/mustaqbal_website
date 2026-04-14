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

export default function DashboardPostsCreate() {
    const { users } = usePage<{ users: UserOption[] }>().props;
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>(['']);
    const { onError } = useFormToast('Post created successfully.');

    return (
        <DashboardPage titleKey="dashboard.posts.createTitle">
            <Form {...posts.store.form()} onError={onError} className="space-y-4">
                <DocumentFrame
                    title="Post editor"
                    description="Draft the post, preview the final layout, and attach a gallery of images."
                    body={content}
                    onBodyChange={setContent}
                    bodyName="content"
                    images={images}
                    onImagesChange={setImages}
                    bodyLabel="Post content"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <select name="user_id" required className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                            ))}
                        </select>
                        <select name="type" required className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" defaultValue="news">
                            <option value="news">News</option>
                            <option value="job">Job</option>
                            <option value="event">Event</option>
                            <option value="achievement">Achievement</option>
                            <option value="student_of_week">Student of Week</option>
                            <option value="student_of_month">Student of Month</option>
                        </select>
                        <select name="visibility" required className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" defaultValue="community">
                            <option value="community">Community</option>
                            <option value="public">Public</option>
                        </select>
                        <select name="highlighted_student_id" className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" defaultValue="">
                            <option value="">No highlighted student</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                        <input name="title" required className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:col-span-2" placeholder="Title" />
                        <input name="job_apply_url" className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" placeholder="Job apply URL" />
                        <input name="scheduled_at" type="datetime-local" className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                        <input name="starts_at" type="datetime-local" className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                        <input name="ends_at" type="datetime-local" className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                </DocumentFrame>

                <button className="w-fit rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700" type="submit">Save post</button>
            </Form>
        </DashboardPage>
    );
}

