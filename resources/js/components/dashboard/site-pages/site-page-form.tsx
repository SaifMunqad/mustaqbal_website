import {
    DocumentTextIcon,
    InformationCircleIcon,
    PhotoIcon,
    RocketLaunchIcon,
    VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CheckboxField, TextAreaField, TextField } from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import { ImageUploadField } from '@/components/form/image-upload-field';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import RichTextEditor from '@/components/editor/rich-text-editor';
import AboutSectionsEditor from '@/components/dashboard/site-pages/about-sections-editor';
import AboutPreview from '@/components/dashboard/site-pages/about-preview';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { AboutContent } from '@/components/school/about/about-types';
import type { LanguageOption, SharedData } from '@/types';

export type TranslationValues = Record<string, Record<string, string>>;

export interface SitePage {
    id: number;
    slug: string;
    title: string;
    hero_image?: string | null;
    is_published: boolean;
}

interface FormShape {
    slug: string;
    hero_image: string;
    video_embed: string;
    is_published: boolean;
    translations: Record<string, { title: string; body: string }>;
    contents: Record<string, AboutContent>;
}

interface SitePageFormProps {
    formProps: { action: string; method: 'post' | 'put' | 'patch' };
    submitLabel: string;
    cancelHref: string;
    toastOnError: (errors: Record<string, string>) => void;
    page?: SitePage;
    translations?: TranslationValues;
    contents?: Record<string, AboutContent>;
    initialVideoEmbed?: string;
    isAbout?: boolean;
}

/**
 * Shared create/edit form for site pages, edited one language at a time via a
 * language dropdown (mirroring the home visual editor) so every staged change
 * commits in a single submit. For the About page it also exposes the structured
 * sections and a live preview; other pages keep the simple title/body editor.
 */
export default function SitePageForm({
    formProps,
    submitLabel,
    cancelHref,
    toastOnError,
    page,
    translations,
    contents,
    initialVideoEmbed,
    isAbout = false,
}: SitePageFormProps) {
    const { languages } = usePage<SharedData>().props;
    const available: LanguageOption[] = languages?.available ?? [];
    const defaultCode = languages?.default ?? 'en';

    const seeded = useMemo<FormShape>(() => {
        const tr: FormShape['translations'] = {};
        const co: FormShape['contents'] = {};

        for (const language of available.length ? available : [{ code: defaultCode, name: defaultCode.toUpperCase(), dir: 'ltr' as const }]) {
            const existing = translations?.[language.code] ?? {};
            tr[language.code] = {
                title: existing.title ?? '',
                body: existing.body ?? '',
            };
            co[language.code] = contents?.[language.code] ?? {};
        }

        return {
            slug: page?.slug ?? '',
            hero_image: page?.hero_image ?? '',
            video_embed: initialVideoEmbed ?? '',
            is_published: page ? page.is_published : true,
            translations: tr,
            contents: co,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, translations, contents, initialVideoEmbed]);

    const form = useForm<FormShape>(seeded);
    const isEdit = Boolean(page);
    const [editingLang, setEditingLang] = useState<string>(defaultCode);

    const dir = (available.find((l) => l.code === editingLang)?.dir as 'ltr' | 'rtl') ?? 'ltr';
    const entry = form.data.translations[editingLang] ?? { title: '', body: '' };
    const content = form.data.contents[editingLang] ?? {};

    const patchTranslation = (key: 'title' | 'body', value: string) =>
        form.setData((data) => ({
            ...data,
            translations: {
                ...data.translations,
                [editingLang]: { ...(data.translations[editingLang] ?? { title: '', body: '' }), [key]: value },
            },
        }));

    const previewContent: AboutContent = {
        ...content,
        body: entry.body,
        video_embed: form.data.video_embed,
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.submit(formProps.method, formProps.action, {
                    preserveScroll: true,
                    onError: toastOnError,
                });
            }}
            className="space-y-4"
        >
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
                <div className="space-y-4">
                    {/* Editing-language selector drives title, body and sections. */}
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                        <span className="text-sm font-medium text-muted-foreground">Editing language</span>
                        <Select value={editingLang} onValueChange={setEditingLang}>
                            <SelectTrigger className="w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(available.length ? available : [{ code: defaultCode, name: defaultCode.toUpperCase(), dir: 'ltr' }]).map((language) => (
                                    <SelectItem key={language.code} value={language.code}>
                                        {language.name}
                                        {language.code === defaultCode ? ' *' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {editingLang !== defaultCode ? (
                            <span className="ms-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                blanks fall back to the default language
                            </span>
                        ) : null}
                    </div>

                    <FormSection
                        title="Page details"
                        description="The slug becomes the public URL (e.g. about → /school/about)."
                        icon={<DocumentTextIcon className="size-5" />}
                    >
                        <TextField
                            label="Slug"
                            name="slug"
                            required
                            value={form.data.slug}
                            onChange={(event) => form.setData('slug', event.target.value)}
                            placeholder="about"
                            error={form.errors.slug}
                        />
                    </FormSection>

                    <FormSection
                        title="Localized content"
                        description="Title and rich-text body for the selected language. The starred language is required and used as the fallback."
                        icon={<DocumentTextIcon className="size-5" />}
                    >
                        <TextField
                            label="Title"
                            name={`title-${editingLang}`}
                            dir={dir}
                            required={editingLang === defaultCode}
                            value={entry.title}
                            onChange={(event) => patchTranslation('title', event.target.value)}
                            placeholder="Page title"
                            maxLength={255}
                        />
                        <RichTextEditor
                            key={`body-${editingLang}`}
                            name={`body-${editingLang}`}
                            value={entry.body}
                            onChange={(html) => patchTranslation('body', html)}
                            dir={dir}
                            placeholder="Write this page here, or import a Word (.docx) document / paste from Word..."
                        />
                    </FormSection>

                    {isAbout ? (
                        <FormSection
                            title="Page sections"
                            description="Structured blocks for the selected language (intro, mission/vision, stats, values, highlights, goals, message, FAQ)."
                            icon={<DocumentTextIcon className="size-5" />}
                        >
                            <AboutSectionsEditor
                                dir={dir}
                                value={content}
                                onChange={(next) =>
                                    form.setData((data) => ({
                                        ...data,
                                        contents: { ...data.contents, [editingLang]: next },
                                    }))
                                }
                            />
                        </FormSection>
                    ) : null}

                    <FormSection
                        title="Hero image"
                        description="Shown at the top of the page. Upload a file or paste a URL. Shared across languages."
                        icon={<PhotoIcon className="size-5" />}
                    >
                        <ImageUploadField
                            label="Hero image"
                            name="hero_image"
                            value={form.data.hero_image}
                            onChange={(value) => form.setData('hero_image', value)}
                            error={form.errors.hero_image}
                        />
                    </FormSection>

                    <FormSection
                        title="Video / Embed"
                        description="Optional embed code (e.g. a YouTube <iframe>) or video URL. Shared across languages."
                        icon={<VideoCameraIcon className="size-5" />}
                    >
                        <TextAreaField
                            label="Embed code or video URL"
                            name="video_embed"
                            value={form.data.video_embed}
                            onChange={(event) => form.setData('video_embed', event.target.value)}
                            rows={4}
                            className="font-mono text-xs"
                            error={form.errors.video_embed}
                        />
                    </FormSection>
                </div>

                <aside className="space-y-4">
                    <FormSection title="Publishing" icon={<RocketLaunchIcon className="size-5" />}>
                        <CheckboxField
                            label={isEdit ? 'Published' : 'Publish now'}
                            name="is_published"
                            checked={form.data.is_published}
                            onCheckedChange={(checked) => form.setData('is_published', checked === true)}
                        />
                        <p className="text-xs text-muted-foreground">
                            {isEdit
                                ? 'Uncheck to hide this page from visitors.'
                                : 'Leave unchecked to keep the page hidden from visitors.'}
                        </p>
                    </FormSection>

                    {isAbout ? (
                        <div className="rounded-2xl border border-border bg-card">
                            <div className="flex items-center justify-between border-b border-border px-4 py-2">
                                <span className="text-sm font-semibold">Live preview</span>
                                <Link href="/school/about" target="_blank" className="text-xs font-medium text-blue-600 underline">
                                    Open public page
                                </Link>
                            </div>
                            <div className="max-h-[70vh] overflow-y-auto p-3">
                                <AboutPreview title={entry.title} content={previewContent} heroImage={form.data.hero_image} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                            <InformationCircleIcon className="mt-0.5 size-4 shrink-0" />
                            <span>
                                New to the editor?{' '}
                                <Link href="/dashboard/site-pages/help" className="font-medium text-blue-600 underline">
                                    Read the writing guide
                                </Link>
                                .
                            </span>
                        </div>
                    )}
                </aside>
            </div>

            <StickyFormFooter
                submitLabel={submitLabel}
                processing={form.processing}
                cancelHref={cancelHref}
            />
        </form>
    );
}
