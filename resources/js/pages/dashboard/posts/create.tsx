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

interface TypeOption {
    value: string;
    label: string;
}

export default function DashboardPostsCreate() {
    const { users, postTypes } = usePage<{ users: UserOption[]; postTypes: TypeOption[] }>().props;
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
                        <SelectField
                            label="Author"
                            name="user_id"
                            required
                            options={users.map((user) => ({ value: String(user.id), label: `${user.name} (${user.role})` }))}
                        />
                        <SelectField label="Type" name="type" required defaultValue="news" options={postTypes} />
                        <SelectField
                            label="Visibility"
                            name="visibility"
                            required
                            defaultValue="community"
                            options={[
                                { value: 'community', label: 'Community' },
                                { value: 'public', label: 'Public' },
                            ]}
                        />
                        <SelectField
                            label="Highlighted student"
                            name="highlighted_student_id"
                            placeholder="No highlighted student"
                            options={[
                                { value: '', label: 'No highlighted student' },
                                ...users.map((user) => ({ value: String(user.id), label: user.name })),
                            ]}
                        />
                        <TextField label="Title" name="title" required placeholder="Title" className="md:col-span-2" />
                        <TextField label="Job apply URL" name="job_apply_url" placeholder="Job apply URL" />
                        <TextField label="Scheduled at" name="scheduled_at" type="datetime-local" />
                        <TextField label="Starts at" name="starts_at" type="datetime-local" />
                        <TextField label="Ends at" name="ends_at" type="datetime-local" />
                        <CheckboxField label="Feature on homepage showcase" name="featured" value="1" />
                        <TextField label="Featured from" name="featured_from" type="datetime-local" />
                        <TextField label="Featured until" name="featured_until" type="datetime-local" />
                    </div>
                </DocumentFrame>

                <Button type="submit">Save post</Button>
            </Form>
        </DashboardPage>
    );
}

