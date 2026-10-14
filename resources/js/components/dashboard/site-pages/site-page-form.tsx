import {
    DocumentTextIcon,
    InformationCircleIcon,
    PhotoIcon,
    RocketLaunchIcon,
    VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { Form, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CheckboxField, TextAreaField, TextField } from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import { ImageUploadField } from '@/components/form/image-upload-field';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/language-tabs-editor';

export type { TranslationValues } from '@/components/language-tabs-editor';

export interface SitePage {
    id: number;
    slug: string;
    title: string;
    hero_image?: string | null;
    is_published: boolean;
}

interface SitePageFormProps {
    // Inertia route target, e.g. sitePages.store.form() / sitePages.update.form(id).
    formProps: { action: string; method: 'post' | 'put' | 'patch' };
    submitLabel: string;
    cancelHref: string;
    toastOnError: (errors: Record<string, string>) => void;
    // Present on edit; absent on create so fields render empty.
    page?: SitePage;
    // Existing per-language title/body, seeded into the localized editor on edit.
    translations?: TranslationValues;
    // Embed code / video URL is shared across languages (not localized).
    initialVideoEmbed?: string;
}

// Localized inputs rendered once per active language (default language required).
const translatableFields: TranslatableField[] = [
    { name: 'title', label: 'Title', type: 'text', placeholder: 'Page title', maxLength: 255 },
    {
        name: 'body',
        label: 'Page body',
        type: 'richtext',
        placeholder: 'Write this page here, or import a Word (.docx) document / paste from Word...',
    },
];

/**
 * Shared create/edit form for editable site pages. The publishing label/helper
 * text and the seeded body/embed differ by mode; everything else is identical.
 */
export default function SitePageForm({
    formProps,
    submitLabel,
    cancelHref,
    toastOnError,
    page,
    translations,
    initialVideoEmbed,
}: SitePageFormProps) {
    const isEdit = Boolean(page);
    const [heroImage, setHeroImage] = useState(page?.hero_image ?? '');

    return (
        <Form {...formProps} onError={toastOnError}>
            {({ errors, processing }) => (
                <div className="space-y-4">
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                        <div className="space-y-4">
                            <FormSection
                                title="Page details"
                                description="The slug becomes the public URL (e.g. about → /about)."
                                icon={<DocumentTextIcon className="size-5" />}
                            >
                                <TextField
                                    label="Slug"
                                    name="slug"
                                    required
                                    defaultValue={page?.slug ?? ''}
                                    placeholder="about"
                                    error={errors.slug}
                                />
                            </FormSection>

                            <FormSection
                                title="Localized content"
                                description="Add the title and rich-text body for each language. The starred language is required and used as the fallback."
                                icon={<DocumentTextIcon className="size-5" />}
                            >
                                <LanguageTabsEditor
                                    fields={translatableFields}
                                    translations={translations}
                                />
                            </FormSection>

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
                                    label={isEdit ? 'Published' : 'Publish now'}
                                    name="is_published"
                                    value="1"
                                    defaultChecked={page ? page.is_published : true}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {isEdit
                                        ? 'Uncheck to hide this page from visitors.'
                                        : 'Leave unchecked to keep the page hidden from visitors.'}
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
                        submitLabel={submitLabel}
                        processing={processing}
                        cancelHref={cancelHref}
                    />
                </div>
            )}
        </Form>
    );
}
