import {
    CalendarIcon,
    DocumentTextIcon,
    PhotoIcon,
    SparklesIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
import DocumentFrame from '@/components/editor/document-frame';
import { CheckboxField, SelectField, TextField } from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import { GalleryUploadField } from '@/components/form/image-upload-field';
import StickyFormFooter from '@/components/form/sticky-form-footer';

export interface PostUserOption {
    id: number;
    name: string;
    role: string;
}

export interface PostTypeOption {
    value: string;
    label: string;
}

export interface Post {
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

// datetime-local inputs need the trailing seconds/milliseconds trimmed off.
const toDateTimeInput = (value?: string | null): string =>
    value ? value.slice(0, 16) : '';

const visibilityOptions = [
    { value: 'community', label: 'Community' },
    { value: 'public', label: 'Public' },
];

interface PostFormProps {
    // Inertia route target, e.g. posts.store.form() / posts.update.form(id).
    formProps: { action: string; method: 'post' | 'put' | 'patch' };
    submitLabel: string;
    cancelHref: string;
    users: PostUserOption[];
    postTypes: PostTypeOption[];
    toastOnError: (errors: Record<string, string>) => void;
    // Present on edit; absent on create so fields render empty and defaults apply.
    post?: Post;
}

/**
 * Shared create/edit form for community posts. Type-driven conditional fields
 * (event schedule / job apply URL) and the homepage-showcase window are local
 * state, identical in both modes; create passes no `post`.
 */
export default function PostForm({
    formProps,
    submitLabel,
    cancelHref,
    users,
    postTypes,
    toastOnError,
    post,
}: PostFormProps) {
    const isEdit = Boolean(post);
    const [content, setContent] = useState(post?.content ?? '');
    const [images, setImages] = useState<string[]>(
        (post?.images ?? []).filter(Boolean),
    );
    const [type, setType] = useState(post?.type ?? 'news');
    const [featured, setFeatured] = useState(Boolean(post?.featured));

    const userOptions = users.map((user) => ({
        value: String(user.id),
        label: `${user.name} (${user.role})`,
    }));

    return (
        <Form {...formProps} onError={toastOnError}>
            {({ errors, processing }) => (
                <div className="space-y-4">
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                        <div className="space-y-4">
                            <FormSection
                                title="Post details"
                                description={isEdit ? 'Pick the type and audience, then update the title.' : 'Pick the type and audience, then add a clear title.'}
                                icon={<DocumentTextIcon className="size-5" />}
                                columns={2}
                            >
                                <SelectField
                                    label="Type"
                                    name="type"
                                    required
                                    defaultValue={post?.type ?? 'news'}
                                    options={postTypes}
                                    onChange={setType}
                                    error={errors.type}
                                />
                                <SelectField
                                    label="Visibility"
                                    name="visibility"
                                    required
                                    defaultValue={post?.visibility ?? 'community'}
                                    options={visibilityOptions}
                                    error={errors.visibility}
                                />
                                <TextField
                                    label="Title"
                                    name="title"
                                    required
                                    defaultValue={post?.title ?? ''}
                                    placeholder="Post title"
                                    className="text-base md:col-span-2"
                                    error={errors.title}
                                />
                            </FormSection>

                            <DocumentFrame
                                title="Post content"
                                description={isEdit ? 'Make changes while previewing the final layout.' : 'Draft the post and preview the final layout.'}
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
                                    error={errors.images ? String(errors.images) : undefined}
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
                                    defaultValue={post ? String(post.user_id) : (users[0] ? String(users[0].id) : '')}
                                    options={userOptions}
                                    error={errors.user_id}
                                />
                                <SelectField
                                    label="Highlighted student"
                                    name="highlighted_student_id"
                                    placeholder="No highlighted student"
                                    defaultValue={post?.highlighted_student_id ? String(post.highlighted_student_id) : ''}
                                    options={[
                                        { value: '', label: 'No highlighted student' },
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
                                    defaultValue={post ? toDateTimeInput(post.scheduled_at) : ''}
                                    error={errors.scheduled_at}
                                />
                                {type === 'event' ? (
                                    <>
                                        <TextField
                                            label="Starts at"
                                            name="starts_at"
                                            type="datetime-local"
                                            defaultValue={post ? toDateTimeInput(post.starts_at) : ''}
                                            error={errors.starts_at}
                                        />
                                        <TextField
                                            label="Ends at"
                                            name="ends_at"
                                            type="datetime-local"
                                            defaultValue={post ? toDateTimeInput(post.ends_at) : ''}
                                            error={errors.ends_at}
                                        />
                                    </>
                                ) : null}
                                {type === 'job' ? (
                                    <TextField
                                        label="Job apply URL"
                                        name="job_apply_url"
                                        type="url"
                                        defaultValue={post?.job_apply_url ?? ''}
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
                                    defaultChecked={isEdit ? Boolean(post?.featured) : false}
                                    onCheckedChange={(checked) => setFeatured(checked === true)}
                                />
                                {featured ? (
                                    <>
                                        <TextField
                                            label="Featured from"
                                            name="featured_from"
                                            type="datetime-local"
                                            defaultValue={post ? toDateTimeInput(post.featured_from) : ''}
                                            error={errors.featured_from}
                                        />
                                        <TextField
                                            label="Featured until"
                                            name="featured_until"
                                            type="datetime-local"
                                            defaultValue={post ? toDateTimeInput(post.featured_until) : ''}
                                            error={errors.featured_until}
                                        />
                                    </>
                                ) : null}
                            </FormSection>
                        </aside>
                    </div>

                    <StickyFormFooter
                        submitLabel={submitLabel}
                        processing={processing}
                        cancelHref={cancelHref}
                    />
                </div>
            )}
        </Form>
    );
}
