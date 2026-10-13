import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import {
    CheckboxField,
    SelectField,
    TextField,
} from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import { GalleryUploadField } from '@/components/form/image-upload-field';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { useFormToast } from '@/components/use-form-toast';
import posts from '@/routes/dashboard/posts';
import {
    CalendarIcon,
    DocumentTextIcon,
    PhotoIcon,
    SparklesIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Form, usePage } from '@inertiajs/react';
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

interface PostCreateProps {
    users: UserOption[];
    postTypes: TypeOption[];
    [key: string]: unknown;
}

export default function DashboardPostsCreate() {
    const { users, postTypes } = usePage<PostCreateProps>().props;
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [type, setType] = useState('news');
    const [featured, setFeatured] = useState(false);
    const { onError } = useFormToast('Post created successfully.');

    const userOptions = users.map((user) => ({
        value: String(user.id),
        label: `${user.name} (${user.role})`,
    }));

    return (
        <DashboardPage titleKey="dashboard.posts.createTitle">
            <Form {...posts.store.form()} onError={onError}>
                {({ errors, processing }) => (
                    <div className="space-y-4">
                        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                            <div className="space-y-4">
                                <FormSection
                                    title="Post details"
                                    description="Pick the type and audience, then add a clear title."
                                    icon={
                                        <DocumentTextIcon className="size-5" />
                                    }
                                    columns={2}
                                >
                                    <SelectField
                                        label="Type"
                                        name="type"
                                        required
                                        defaultValue="news"
                                        options={postTypes}
                                        onChange={setType}
                                        error={errors.type}
                                    />
                                    <SelectField
                                        label="Visibility"
                                        name="visibility"
                                        required
                                        defaultValue="community"
                                        options={[
                                            {
                                                value: 'community',
                                                label: 'Community',
                                            },
                                            {
                                                value: 'public',
                                                label: 'Public',
                                            },
                                        ]}
                                        error={errors.visibility}
                                    />
                                    <TextField
                                        label="Title"
                                        name="title"
                                        required
                                        placeholder="Post title"
                                        className="text-base md:col-span-2"
                                        error={errors.title}
                                    />
                                </FormSection>

                                <DocumentFrame
                                    title="Post content"
                                    description="Draft the post and preview the final layout."
                                    body={content}
                                    onBodyChange={setContent}
                                    bodyName="content"
                                    bodyLabel="Post content"
                                />

                                <FormSection
                                    title="Images"
                                    description="Upload or paste image URLs for this post."
                                    icon={<PhotoIcon className="size-5" />}
                                >
                                    <GalleryUploadField
                                        label="Post images"
                                        name="images"
                                        images={images}
                                        onChange={setImages}
                                        error={
                                            errors.images
                                                ? String(errors.images)
                                                : undefined
                                        }
                                    />
                                </FormSection>
                            </div>

                            <aside className="space-y-4">
                                <FormSection
                                    title="Author"
                                    icon={<UserIcon className="size-5" />}
                                >
                                    <SelectField
                                        label="Author"
                                        name="user_id"
                                        required
                                        defaultValue={
                                            users[0] ? String(users[0].id) : ''
                                        }
                                        options={userOptions}
                                        error={errors.user_id}
                                    />
                                    <SelectField
                                        label="Highlighted student"
                                        name="highlighted_student_id"
                                        placeholder="No highlighted student"
                                        defaultValue=""
                                        options={[
                                            {
                                                value: '',
                                                label: 'No highlighted student',
                                            },
                                            ...userOptions,
                                        ]}
                                        hint="Used for recognition posts."
                                        error={errors.highlighted_student_id}
                                    />
                                </FormSection>

                                <FormSection
                                    title="Scheduling"
                                    icon={<CalendarIcon className="size-5" />}
                                    columns={1}
                                >
                                    <TextField
                                        label="Scheduled at"
                                        name="scheduled_at"
                                        type="datetime-local"
                                        error={errors.scheduled_at}
                                    />
                                    {type === 'event' ? (
                                        <>
                                            <TextField
                                                label="Starts at"
                                                name="starts_at"
                                                type="datetime-local"
                                                error={errors.starts_at}
                                            />
                                            <TextField
                                                label="Ends at"
                                                name="ends_at"
                                                type="datetime-local"
                                                error={errors.ends_at}
                                            />
                                        </>
                                    ) : null}
                                    {type === 'job' ? (
                                        <TextField
                                            label="Job apply URL"
                                            name="job_apply_url"
                                            type="url"
                                            placeholder="https://…"
                                            error={errors.job_apply_url}
                                        />
                                    ) : null}
                                </FormSection>

                                <FormSection
                                    title="Homepage showcase"
                                    icon={<SparklesIcon className="size-5" />}
                                >
                                    <CheckboxField
                                        label="Feature on homepage"
                                        name="featured"
                                        value="1"
                                        onCheckedChange={(checked) =>
                                            setFeatured(checked === true)
                                        }
                                    />
                                    {featured ? (
                                        <>
                                            <TextField
                                                label="Featured from"
                                                name="featured_from"
                                                type="datetime-local"
                                                error={errors.featured_from}
                                            />
                                            <TextField
                                                label="Featured until"
                                                name="featured_until"
                                                type="datetime-local"
                                                error={errors.featured_until}
                                            />
                                        </>
                                    ) : null}
                                </FormSection>
                            </aside>
                        </div>

                        <StickyFormFooter
                            submitLabel="Save post"
                            processing={processing}
                            cancelHref={posts.index.url()}
                        />
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
