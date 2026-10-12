import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import { CheckboxField, TextField } from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import {
    GalleryUploadField,
    ImageUploadField,
} from '@/components/form/image-upload-field';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { useFormToast } from '@/components/use-form-toast';
import articles from '@/routes/dashboard/articles';
import {
    DocumentTextIcon,
    PhotoIcon,
    RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { Form, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Article {
    id: number;
    title: string;
    excerpt?: string | null;
    body: string;
    cover_image?: string | null;
    images?: string[] | null;
    is_published: boolean;
}

export default function DashboardArticlesEdit() {
    const { article } = usePage<{ article: Article }>().props;
    const [body, setBody] = useState(article.body);
    const [coverImage, setCoverImage] = useState(article.cover_image ?? '');
    const [images, setImages] = useState<string[]>(
        (article.images ?? []).filter(Boolean),
    );
    const { onError } = useFormToast('Article updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.articles.editTitle">
            <Form {...articles.update.form(article.id)} onError={onError}>
                {({ errors, processing }) => (
                    <div className="space-y-4">
                        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                            <div className="space-y-4">
                                <FormSection
                                    title="Content"
                                    description="Give the article a clear title and a short summary."
                                    icon={
                                        <DocumentTextIcon className="size-5" />
                                    }
                                    columns={2}
                                >
                                    <TextField
                                        label="Title"
                                        name="title"
                                        required
                                        defaultValue={article.title}
                                        className="text-base md:col-span-2"
                                        error={errors.title}
                                    />
                                    <TextField
                                        label="Excerpt"
                                        name="excerpt"
                                        defaultValue={article.excerpt ?? ''}
                                        className="md:col-span-2"
                                        hint="Max 1000 characters"
                                        maxLength={1000}
                                        error={errors.excerpt}
                                    />
                                </FormSection>

                                <DocumentFrame
                                    title="Article body"
                                    description="Keep the writing and preview in sync while editing."
                                    body={body}
                                    onBodyChange={setBody}
                                    bodyLabel="Article body"
                                />

                                <FormSection
                                    title="Media"
                                    description="Upload or paste image URLs. Files are stored and previewed instantly."
                                    icon={<PhotoIcon className="size-5" />}
                                >
                                    <ImageUploadField
                                        label="Cover image"
                                        name="cover_image"
                                        value={coverImage}
                                        onChange={setCoverImage}
                                        error={errors.cover_image}
                                    />
                                    <GalleryUploadField
                                        label="Gallery images"
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
                                    title="Publishing"
                                    icon={
                                        <RocketLaunchIcon className="size-5" />
                                    }
                                >
                                    <CheckboxField
                                        label="Published"
                                        name="is_published"
                                        value="1"
                                        defaultChecked={article.is_published}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Uncheck to revert this article to a
                                        draft.
                                    </p>
                                </FormSection>
                            </aside>
                        </div>

                        <StickyFormFooter
                            submitLabel="Update article"
                            processing={processing}
                            cancelHref={articles.index.url()}
                        />
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
