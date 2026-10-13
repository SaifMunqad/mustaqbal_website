import DashboardPage from '@/components/dashboard/dashboard-page';
import RichTextEditor from '@/components/editor/rich-text-editor';
import { CheckboxField, TextAreaField, TextField } from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import { ImageUploadField } from '@/components/form/image-upload-field';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { useFormToast } from '@/components/use-form-toast';
import sitePages from '@/routes/dashboard/site-pages';
import {
    DocumentTextIcon,
    InformationCircleIcon,
    PhotoIcon,
    RocketLaunchIcon,
    VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { Form, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SitePage {
    id: number;
    slug: string;
    title: string;
    hero_image?: string | null;
    is_published: boolean;
}

export default function DashboardSitePagesEdit() {
    const { page, body: initialBody, videoEmbed: initialVideoEmbed } = usePage<{
        page: SitePage;
        body: string;
        videoEmbed?: string;
    }>().props;
    const [body, setBody] = useState(initialBody ?? '');
    const [heroImage, setHeroImage] = useState(page.hero_image ?? '');
    const { onError } = useFormToast('Page updated successfully.');
    const { i18n } = useTranslation();
    const editorDir = i18n.dir() === 'rtl' ? 'rtl' : 'ltr';

    return (
        <DashboardPage titleKey="dashboard.pages.editTitle">
            <Form {...sitePages.update.form(page.id)} onError={onError}>
                {({ errors, processing }) => (
                    <div className="space-y-4">
                        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                            <div className="space-y-4">
                                <FormSection
                                    title="Page details"
                                    description="The slug becomes the public URL (e.g. about → /about)."
                                    icon={<DocumentTextIcon className="size-5" />}
                                    columns={2}
                                >
                                    <TextField
                                        label="Slug"
                                        name="slug"
                                        required
                                        defaultValue={page.slug}
                                        className="text-base md:col-span-2"
                                        error={errors.slug}
                                    />
                                    <TextField
                                        label="Title"
                                        name="title"
                                        required
                                        defaultValue={page.title}
                                        className="md:col-span-2"
                                        error={errors.title}
                                    />
                                </FormSection>

                                <RichTextEditor
                                    name="body"
                                    value={body}
                                    onChange={setBody}
                                    dir={editorDir}
                                    placeholder="Write this page here, or import a Word (.docx) document / paste from Word..."
                                />

                                <FormSection
                                    title="Hero image"
                                    description="Shown at the top of the page. Upload a file or paste a URL."
                                    icon={<PhotoIcon className="size-5" />}
                                >
                                    <ImageUploadField
                                        label="Hero image"
                                        name="hero_image"
                                        value={heroImage}
                                        onChange={setHeroImage}
                                        error={errors.hero_image}
                                    />
                                </FormSection>

                                <FormSection
                                    title="Video / Embed"
                                    description="Optional. Paste an embed code (e.g. a YouTube <iframe>) or a video URL. Shown as a responsive video on the page."
                                    icon={<VideoCameraIcon className="size-5" />}
                                >
                                    <TextAreaField
                                        label="Embed code or video URL"
                                        name="video_embed"
                                        defaultValue={initialVideoEmbed ?? ''}
                                        placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/..." ...></iframe>'
                                        rows={4}
                                        className="font-mono text-xs"
                                        error={errors.video_embed}
                                    />
                                </FormSection>
                            </div>

                            <aside className="space-y-4">
                                <FormSection
                                    title="Publishing"
                                    icon={<RocketLaunchIcon className="size-5" />}
                                >
                                    <CheckboxField
                                        label="Published"
                                        name="is_published"
                                        value="1"
                                        defaultChecked={page.is_published}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Uncheck to hide this page from visitors.
                                    </p>
                                </FormSection>

                                <div className="flex items-start gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                                    <InformationCircleIcon className="mt-0.5 size-4 shrink-0" />
                                    <span>
                                        New to the editor?{' '}
                                        <Link
                                            href="/dashboard/site-pages/help"
                                            className="font-medium text-blue-600 underline"
                                        >
                                            Read the writing guide
                                        </Link>
                                        .
                                    </span>
                                </div>
                            </aside>
                        </div>

                        <StickyFormFooter
                            submitLabel="Update page"
                            processing={processing}
                            cancelHref={sitePages.index.url()}
                        />
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
