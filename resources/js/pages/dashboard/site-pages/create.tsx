import DashboardPage from '@/components/dashboard/dashboard-page';
import RichTextEditor from '@/components/editor/rich-text-editor';
import { CheckboxField, TextField } from '@/components/form-fields';
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
} from '@heroicons/react/24/outline';
import { Form, Link } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function DashboardSitePagesCreate() {
    const [body, setBody] = useState('');
    const [heroImage, setHeroImage] = useState('');
    const { onError } = useFormToast('Page created successfully.');
    const { i18n } = useTranslation();
    const editorDir = i18n.dir() === 'rtl' ? 'rtl' : 'ltr';

    return (
        <DashboardPage titleKey="dashboard.pages.createTitle">
            <Form {...sitePages.store.form()} onError={onError}>
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
                                        placeholder="about"
                                        className="text-base md:col-span-2"
                                        error={errors.slug}
                                    />
                                    <TextField
                                        label="Title"
                                        name="title"
                                        required
                                        placeholder="Page title"
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
                            </div>

                            <aside className="space-y-4">
                                <FormSection
                                    title="Publishing"
                                    icon={<RocketLaunchIcon className="size-5" />}
                                >
                                    <CheckboxField
                                        label="Publish now"
                                        name="is_published"
                                        value="1"
                                        defaultChecked
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave unchecked to keep the page hidden
                                        from visitors.
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
                            submitLabel="Save page"
                            processing={processing}
                            cancelHref={sitePages.index.url()}
                        />
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
