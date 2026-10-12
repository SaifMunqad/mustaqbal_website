import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import { CheckboxField, SelectField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
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
    featured?: boolean;
    featured_from?: string | null;
    featured_until?: string | null;
}

interface TypeOption {
    value: string;
    label: string;
}

const toDateTimeInput = (value?: string | null): string => {
    if (!value) return '';
    return value.slice(0, 16);
};

export default function DashboardPostsEdit() {
    const { users, post, postTypes } = usePage<{ users: UserOption[]; post: Post; postTypes: TypeOption[] }>().props;
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
                        <SelectField
                            label="Author"
                            name="user_id"
                            required
                            defaultValue={String(post.user_id)}
                            options={users.map((user) => ({ value: String(user.id), label: `${user.name} (${user.role})` }))}
                        />
                        <SelectField label="Type" name="type" required defaultValue={post.type} options={postTypes} />
                        <SelectField
                            label="Visibility"
                            name="visibility"
                            required
                            defaultValue={post.visibility}
                            options={[
                                { value: 'community', label: 'Community' },
                                { value: 'public', label: 'Public' },
                            ]}
                        />
                        <SelectField
                            label="Highlighted student"
                            name="highlighted_student_id"
                            placeholder="No highlighted student"
                            defaultValue={post.highlighted_student_id ? String(post.highlighted_student_id) : ''}
                            options={[
                                { value: '', label: 'No highlighted student' },
                                ...users.map((user) => ({ value: String(user.id), label: user.name })),
                            ]}
                        />
                        <TextField label="Title" name="title" required defaultValue={post.title} className="md:col-span-2" />
                        <TextField label="Job apply URL" name="job_apply_url" defaultValue={post.job_apply_url ?? ''} />
                        <TextField label="Scheduled at" name="scheduled_at" type="datetime-local" defaultValue={toDateTimeInput(post.scheduled_at)} />
                        <TextField label="Starts at" name="starts_at" type="datetime-local" defaultValue={toDateTimeInput(post.starts_at)} />
                        <TextField label="Ends at" name="ends_at" type="datetime-local" defaultValue={toDateTimeInput(post.ends_at)} />
                        <CheckboxField label="Feature on homepage showcase" name="featured" value="1" defaultChecked={Boolean(post.featured)} />
                        <TextField label="Featured from" name="featured_from" type="datetime-local" defaultValue={toDateTimeInput(post.featured_from)} />
                        <TextField label="Featured until" name="featured_until" type="datetime-local" defaultValue={toDateTimeInput(post.featured_until)} />
                    </div>
                </DocumentFrame>

                <Button type="submit">Update post</Button>
            </Form>
        </DashboardPage>
    );
}

