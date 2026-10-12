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
import { Form } from '@inertiajs/react';
import { useState } from 'react';

export default function DashboardArticlesCreate() {
    const [body, setBody] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const { onError } = useFormToast('Article created successfully.');

    return (
        <DashboardPage titleKey="dashboard.articles.createTitle">
            <Form {...articles.store.form()} onError={onError}>
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
                                        placeholder="Article title"
                                        className="text-base md:col-span-2"
                                        error={errors.title}
                                    />
                                    <TextField
                                        label="Excerpt"
                                        name="excerpt"
                                        placeholder="One or two sentences shown in listings"
                                        className="md:col-span-2"
                                        hint="Max 1000 characters"
                                        maxLength={1000}
                                        error={errors.excerpt}
                                    />
                                </FormSection>

                                <DocumentFrame
                                    title="Article body"
                                    description="Write the article and preview it before publishing."
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
                                        label="Publish now"
                                        name="is_published"
                                        value="1"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave unchecked to save the article as a
                                        draft.
                                    </p>
                                </FormSection>
                            </aside>
                        </div>

                        <StickyFormFooter
                            submitLabel="Save article"
                            processing={processing}
                            cancelHref={articles.index.url()}
                        />
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
