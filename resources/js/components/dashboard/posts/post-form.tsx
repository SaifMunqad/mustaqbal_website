import {
    CalendarIcon,
    DocumentTextIcon,
    PhotoIcon,
    SparklesIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField, SelectField, TextField } from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import { GalleryUploadField } from '@/components/form/image-upload-field';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/language-tabs-editor';

export type { TranslationValues } from '@/components/language-tabs-editor';

export interface PostUserOption {
    id: number;
    name: string;
    role: string;
}

export interface PostTypeOption {
    value: string;
    label: string;
    labelKey?: string;
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
    // Existing per-language content, seeded into the localized editor on edit.
    translations?: TranslationValues;
}

// Localized inputs are built inside the component so their labels follow the
// active UI language.

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
    translations,
}: PostFormProps) {
    const { t } = useTranslation();
    const isEdit = Boolean(post);
    const [images, setImages] = useState<string[]>(
        (post?.images ?? []).filter(Boolean),
    );
    const [type, setType] = useState(post?.type ?? 'news');
    const [featured, setFeatured] = useState(Boolean(post?.featured));

    const userOptions = users.map((user) => ({
        value: String(user.id),
        label: `${user.name} (${user.role})`,
    }));

    const visibilityOptions = [
        {
            value: 'community',
            labelKey: 'dashboard.posts.form.visibilityCommunity',
        },
        {
            value: 'public',
            labelKey: 'dashboard.posts.form.visibilityPublic',
        },
    ];

    const translatableFields: TranslatableField[] = [
        {
            name: 'title',
            label: t('dashboard.posts.form.title'),
            type: 'text',
            placeholder: t('dashboard.posts.form.titlePlaceholder'),
            maxLength: 255,
        },
        {
            name: 'content',
            label: t('dashboard.posts.form.postContent'),
            type: 'richtext',
            placeholder: t('dashboard.posts.form.contentPlaceholder'),
        },
    ];

    return (
        <Form {...formProps} onError={toastOnError}>
            {({ errors, processing }) => (
                <div className="space-y-4">
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                        <div className="space-y-4">
                            <FormSection
                                title={t('dashboard.posts.form.details')}
                                description={
                                    isEdit
                                        ? t(
                                              'dashboard.posts.form.detailsEdit',
                                          )
                                        : t(
                                              'dashboard.posts.form.detailsCreate',
                                          )
                                }
                                icon={<DocumentTextIcon className="size-5" />}
                                columns={2}
                            >
                                <SelectField
                                    label={t('dashboard.posts.form.type')}
                                    name="type"
                                    required
                                    defaultValue={post?.type ?? 'news'}
                                    options={postTypes}
                                    onChange={setType}
                                    error={errors.type}
                                />
                                <SelectField
                                    label={t(
                                        'dashboard.posts.form.visibility',
                                    )}
                                    name="visibility"
                                    required
                                    defaultValue={post?.visibility ?? 'community'}
                                    options={visibilityOptions}
                                    error={errors.visibility}
                                />
                            </FormSection>

                            <FormSection
                                title={t('dashboard.posts.form.content')}
                                description={t(
                                    'dashboard.posts.form.contentDescription',
                                )}
                                icon={<DocumentTextIcon className="size-5" />}
                            >
                                <LanguageTabsEditor
                                    fields={translatableFields}
                                    translations={translations}
                                />
                            </FormSection>

                            <FormSection
                                title={t('dashboard.posts.form.images')}
                                description={t(
                                    'dashboard.posts.form.imagesDescription',
                                )}
                                icon={<PhotoIcon className="size-5" />}
                            >
                                <GalleryUploadField
                                    label={t(
                                        'dashboard.posts.form.postImages',
                                    )}
                                    name="images"
                                    images={images}
                                    onChange={setImages}
                                    error={errors.images ? String(errors.images) : undefined}
                                />
                            </FormSection>
                        </div>

                        <aside className="space-y-4">
                            <FormSection
                                title={t('dashboard.posts.form.author')}
                                icon={<UserIcon className="size-5" />}
                            >
                                <SelectField
                                    label={t('dashboard.posts.form.author')}
                                    name="user_id"
                                    required
                                    defaultValue={post ? String(post.user_id) : (users[0] ? String(users[0].id) : '')}
                                    options={userOptions}
                                    error={errors.user_id}
                                />
                                <SelectField
                                    label={t(
                                        'dashboard.posts.form.highlightedStudent',
                                    )}
                                    name="highlighted_student_id"
                                    placeholder={t(
                                        'dashboard.posts.form.noHighlightedStudent',
                                    )}
                                    defaultValue={post?.highlighted_student_id ? String(post.highlighted_student_id) : ''}
                                    options={[
                                        {
                                            value: '',
                                            label: t(
                                                'dashboard.posts.form.noHighlightedStudent',
                                            ),
                                        },
                                        ...userOptions,
                                    ]}
                                    hint={t(
                                        'dashboard.posts.form.highlightedHint',
                                    )}
                                    error={errors.highlighted_student_id}
                                />
                            </FormSection>

                            <FormSection
                                title={t(
                                    'dashboard.posts.form.scheduling',
                                )}
                                icon={<CalendarIcon className="size-5" />}
                                columns={1}
                            >
                                <TextField
                                    label={t(
                                        'dashboard.posts.form.scheduledAt',
                                    )}
                                    name="scheduled_at"
                                    type="datetime-local"
                                    defaultValue={post ? toDateTimeInput(post.scheduled_at) : ''}
                                    error={errors.scheduled_at}
                                />
                                {type === 'event' ? (
                                    <>
                                        <TextField
                                            label={t(
                                                'dashboard.posts.form.startsAt',
                                            )}
                                            name="starts_at"
                                            type="datetime-local"
                                            defaultValue={post ? toDateTimeInput(post.starts_at) : ''}
                                            error={errors.starts_at}
                                        />
                                        <TextField
                                            label={t(
                                                'dashboard.posts.form.endsAt',
                                            )}
                                            name="ends_at"
                                            type="datetime-local"
                                            defaultValue={post ? toDateTimeInput(post.ends_at) : ''}
                                            error={errors.ends_at}
                                        />
                                    </>
                                ) : null}
                                {type === 'job' ? (
                                    <TextField
                                        label={t(
                                            'dashboard.posts.form.jobApplyUrl',
                                        )}
                                        name="job_apply_url"
                                        type="url"
                                        defaultValue={post?.job_apply_url ?? ''}
                                        placeholder="https://…"
                                        error={errors.job_apply_url}
                                    />
                                ) : null}
                            </FormSection>

                            <FormSection
                                title={t('dashboard.posts.form.showcase')}
                                icon={<SparklesIcon className="size-5" />}
                            >
                                <CheckboxField
                                    label={t(
                                        'dashboard.posts.form.featureOnHomepage',
                                    )}
                                    name="featured"
                                    value="1"
                                    defaultChecked={isEdit ? Boolean(post?.featured) : false}
                                    onCheckedChange={(checked) => setFeatured(checked === true)}
                                />
                                {featured ? (
                                    <>
                                        <TextField
                                            label={t(
                                                'dashboard.posts.form.featuredFrom',
                                            )}
                                            name="featured_from"
                                            type="datetime-local"
                                            defaultValue={post ? toDateTimeInput(post.featured_from) : ''}
                                            error={errors.featured_from}
                                        />
                                        <TextField
                                            label={t(
                                                'dashboard.posts.form.featuredUntil',
                                            )}
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
