import DashboardPage from '@/components/dashboard/dashboard-page';
import { CheckboxField, TextField } from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import RichTextEditor from '@/components/editor/rich-text-editor';
import { useFormToast } from '@/components/use-form-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { LanguageOption, SharedData } from '@/types';
import {
    DocumentTextIcon,
    EyeIcon,
    RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface AboutPage {
    id: number;
    slug: string;
    title: string;
    is_published: boolean;
}

interface TranslationEntry {
    title: string;
    body: string;
}

interface Props {
    page: AboutPage;
    translations: Record<string, TranslationEntry>;
    [key: string]: unknown;
}

interface FormShape {
    slug: string;
    is_published: boolean;
    translations: Record<string, TranslationEntry>;
}

/**
 * Dedicated standard editor for the About page: localized title + rich-text body
 * only, edited one language at a time (the default language is required and acts
 * as the fallback). The structured, block-level sections are authored in the
 * visual editor, reached from the link below — the same standard → visual split
 * the home page uses. Saving here never touches the structured sections.
 */
export default function DashboardAboutEdit() {
    const { page, translations } = usePage<Props>().props;
    const { languages } = usePage<SharedData>().props;
    const { onSuccess, onError } = useFormToast('About page updated successfully.');

    const available: LanguageOption[] = languages?.available ?? [];
    const defaultCode = languages?.default ?? 'en';
    const options = available.length
        ? available
        : [{ code: defaultCode, name: defaultCode.toUpperCase(), dir: 'ltr' as const }];

    const seeded = useMemo<FormShape>(() => {
        const tr: FormShape['translations'] = {};

        for (const language of options) {
            const existing = translations?.[language.code] ?? {};
            tr[language.code] = {
                title: existing.title ?? '',
                body: existing.body ?? '',
            };
        }

        return {
            slug: page.slug,
            is_published: page.is_published,
            translations: tr,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, translations]);

    const form = useForm<FormShape>(seeded);
    const [editingLang, setEditingLang] = useState<string>(defaultCode);

    const dir = options.find((l) => l.code === editingLang)?.dir ?? 'ltr';
    const entry = form.data.translations[editingLang] ?? { title: '', body: '' };

    const patchTranslation = (key: 'title' | 'body', value: string) =>
        form.setData((data) => ({
            ...data,
            translations: {
                ...data.translations,
                [editingLang]: {
                    ...(data.translations[editingLang] ?? { title: '', body: '' }),
                    [key]: value,
                },
            },
        }));

    return (
        <DashboardPage
            titleKey="dashboard.about.title"
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'About', href: '/dashboard/about' },
            ]}
            actions={
                <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/about/visual">Visual editor</Link>
                </Button>
            }
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.submit('put', '/dashboard/about', {
                        preserveScroll: true,
                        onSuccess,
                        onError,
                    });
                }}
                className="space-y-4"
            >
                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
                    <div className="space-y-4">
                        {/* Editing-language selector drives title and body. */}
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                            <span className="text-sm font-medium text-muted-foreground">Editing language</span>
                            <Select value={editingLang} onValueChange={setEditingLang}>
                                <SelectTrigger className="w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((language) => (
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
                                placeholder="About page title"
                                maxLength={255}
                            />
                            <RichTextEditor
                                key={`body-${editingLang}`}
                                name={`body-${editingLang}`}
                                value={entry.body}
                                onChange={(html) => patchTranslation('body', html)}
                                dir={dir}
                                placeholder="Write the about story here, or import a Word (.docx) document / paste from Word..."
                            />
                        </FormSection>
                    </div>

                    <aside className="space-y-4">
                        <FormSection title="Publishing" icon={<RocketLaunchIcon className="size-5" />}>
                            <CheckboxField
                                label="Published"
                                name="is_published"
                                checked={form.data.is_published}
                                onCheckedChange={(checked) => form.setData('is_published', checked === true)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Uncheck to hide the About page from visitors.
                            </p>
                        </FormSection>

                        {/* Gateway to the block editor: sections (stats, values, FAQ…) live there. */}
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <div className="flex items-center gap-2">
                                <EyeIcon className="size-5 text-blue-600" />
                                <span className="text-sm font-semibold">Edit visually</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Arrange and edit the About page blocks — hero, story, stats,
                                mission &amp; vision, values, highlights, leadership message,
                                goals and FAQ — on a live preview.
                            </p>
                            <Button asChild size="sm" className="mt-3 w-full">
                                <Link href="/dashboard/about/visual">Open visual editor</Link>
                            </Button>
                        </div>
                    </aside>
                </div>

                <StickyFormFooter submitLabel="Save changes" processing={form.processing} />
            </form>
        </DashboardPage>
    );
}
