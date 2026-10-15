import { Head, router, usePage } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckboxField, TextAreaField } from '@/components/form-fields';
import { ImageUploadField } from '@/components/form/image-upload-field';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import RichTextEditor from '@/components/editor/rich-text-editor';
import AboutSectionsEditor, {
    type AboutSectionKey,
} from '@/components/dashboard/site-pages/about-sections-editor';

import AboutHero from '@/components/school/about/about-hero';
import AboutStatsBand from '@/components/school/about/about-stats-band';
import AboutStorySection from '@/components/school/about/about-story-section';
import AboutVideoSection from '@/components/school/about/about-video-section';
import AboutMissionVision from '@/components/school/about/about-mission-vision';
import AboutValuesSection from '@/components/school/about/about-values-section';
import AboutHighlightsSection from '@/components/school/about/about-highlights-section';
import AboutLeadershipMessage from '@/components/school/about/about-leadership-message';
import AboutGoalsPointsSection from '@/components/school/about/about-goals-points-section';
import AboutFaqSection from '@/components/school/about/about-faq-section';
import AboutCtaBand from '@/components/school/about/about-cta-band';
import type { AboutContent } from '@/components/school/about/about-types';
import type { LanguageOption, SharedData } from '@/types';

interface VisualProps {
    page: { id: number; slug: string; hero_image?: string | null; is_published: boolean };
    translations: Record<string, { title: string; body: string }>;
    contents: Record<string, AboutContent>;
    videoEmbed?: string;
    [key: string]: unknown;
}

// A block is a canvas section with an edit affordance. `only` scopes the shared
// sections editor to just this block's fields; body/hero/settings are bespoke.
type BlockKey =
    | 'hero'
    | 'body'
    | 'stats'
    | 'mission'
    | 'values'
    | 'highlights'
    | 'message'
    | 'goals'
    | 'faq'
    | 'settings';

const BLOCK_LABELS: Record<BlockKey, string> = {
    hero: 'Hero',
    body: 'Story / body',
    stats: 'Stats',
    mission: 'Mission & vision',
    values: 'Values',
    highlights: 'Highlights',
    message: 'Leadership message',
    goals: 'Goals & key points',
    faq: 'FAQ',
    settings: 'Media & publishing',
};

const BLOCK_SECTION_KEYS: Partial<Record<BlockKey, AboutSectionKey[]>> = {
    stats: ['stats'],
    mission: ['mission', 'vision'],
    values: ['values'],
    highlights: ['highlights'],
    message: ['message'],
    goals: ['goals', 'main_points'],
    faq: ['faq'],
};

export default function SitePageVisual() {
    const { page, translations, contents, videoEmbed } = usePage<VisualProps>().props;
    const { languages } = usePage<SharedData>().props;
    const { t } = useTranslation();

    const available: LanguageOption[] = languages?.available ?? [];
    const defaultCode = languages?.default ?? 'en';

    const [tr, setTr] = useState<Record<string, { title: string; body: string }>>(
        () => translations ?? {},
    );
    const [co, setCo] = useState<Record<string, AboutContent>>(() => contents ?? {});
    const [heroImage, setHeroImage] = useState<string>(page.hero_image ?? '');
    const [video, setVideo] = useState<string>(videoEmbed ?? '');
    const [published, setPublished] = useState<boolean>(page.is_published);
    const [editingLang, setEditingLang] = useState<string>(defaultCode);
    const [dirty, setDirty] = useState(false);
    const [block, setBlock] = useState<BlockKey | null>(null);

    useEffect(() => {
        if (!dirty) return;
        const handler = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = true;
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    const dir = (available.find((l) => l.code === editingLang)?.dir as 'ltr' | 'rtl') ?? 'ltr';
    const entry = tr[editingLang] ?? { title: '', body: '' };
    const content = co[editingLang] ?? {};

    const setTitle = (value: string) => {
        setTr((prev) => ({ ...prev, [editingLang]: { ...(prev[editingLang] ?? { title: '', body: '' }), title: value } }));
        setDirty(true);
    };
    const setBody = (value: string) => {
        setTr((prev) => ({ ...prev, [editingLang]: { ...(prev[editingLang] ?? { title: '', body: '' }), body: value } }));
        setDirty(true);
    };
    const setContent = (next: AboutContent) => {
        setCo((prev) => ({ ...prev, [editingLang]: next }));
        setDirty(true);
    };

    const save = () => {
        router.put(
            `/dashboard/site-pages/${page.id}`,
            {
                slug: page.slug,
                hero_image: heroImage,
                video_embed: video,
                is_published: published,
                translations: tr,
                contents: co as unknown as FormDataConvertible,
            },
            {
                preserveScroll: true,
                onSuccess: () => setDirty(false),
            },
        );
    };

    // Read-only rendered blocks (what visitors see), fed by the editing language.
    const stats = (content.stats ?? []).filter((s) => s.value || s.label);
    const values = (content.values ?? []).filter((v) => v.title);
    const highlights = (content.highlights ?? []).filter((h) => h.title);
    const faq = (content.faq ?? []).filter((f) => f.question);
    const goals = content.goals ?? [];
    const mainPoints = content.main_points ?? [];
    const message =
        content.message?.text
            ? {
                  text: content.message.text,
                  author_name: content.message.author_name,
                  author_role: content.message.author_role,
                  author_image: content.message.author_image,
              }
            : null;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Pages', href: '/dashboard/site-pages' },
                { title: 'Visual editor', href: `/dashboard/site-pages/${page.id}/visual` },
            ]}
        >
            <Head title="Page visual editor" />

            <div className="sticky top-0 z-40 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Editing language</span>
                        <Select value={editingLang} onValueChange={setEditingLang}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {available.map((option) => (
                                    <SelectItem key={option.code} value={option.code}>
                                        {option.name}
                                        {option.code === defaultCode ? ' *' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="ms-auto flex items-center gap-2">
                        <Button size="sm" variant="outline" type="button" onClick={() => setBlock('settings')}>
                            ⚙ Media & publishing
                        </Button>
                        <Button size="sm" type="button" onClick={save} disabled={!dirty}>
                            {t('common.save', 'Save')}
                            {dirty ? ' •' : ''}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl space-y-4 pb-16" dir={dir}>
                <EditableBlock label={BLOCK_LABELS.hero} onEdit={() => setBlock('hero')}>
                    <AboutHero
                        title={entry.title || t('about.title')}
                        intro={content.intro}
                        image={heroImage || null}
                        tagline={t('about.badge')}
                        enrollLabel={t('about.heroEnroll')}
                        contactLabel={t('about.heroContact')}
                    />
                </EditableBlock>

                <EditableBlock label={BLOCK_LABELS.body} onEdit={() => setBlock('body')} empty={!entry.body?.trim()}>
                    {entry.body?.trim() ? <AboutStorySection body={entry.body} /> : null}
                </EditableBlock>

                <EditableBlock label={BLOCK_LABELS.stats} onEdit={() => setBlock('stats')} empty={stats.length === 0}>
                    {stats.length ? <AboutStatsBand stats={stats} /> : null}
                </EditableBlock>

                {video.trim() ? (
                    <EditableBlock label="Video" onEdit={() => setBlock('settings')}>
                        <AboutVideoSection embed={video} title={entry.title} />
                    </EditableBlock>
                ) : null}

                <EditableBlock label={BLOCK_LABELS.mission} onEdit={() => setBlock('mission')} empty={!content.mission && !content.vision}>
                    <AboutMissionVision mission={content.mission} vision={content.vision} />
                </EditableBlock>

                <EditableBlock label={BLOCK_LABELS.values} onEdit={() => setBlock('values')} empty={values.length === 0}>
                    {values.length ? <AboutValuesSection values={values} /> : null}
                </EditableBlock>

                <EditableBlock label={BLOCK_LABELS.highlights} onEdit={() => setBlock('highlights')} empty={highlights.length === 0}>
                    {highlights.length ? <AboutHighlightsSection highlights={highlights} /> : null}
                </EditableBlock>

                <EditableBlock label={BLOCK_LABELS.message} onEdit={() => setBlock('message')} empty={!message}>
                    {message ? <AboutLeadershipMessage message={message} /> : null}
                </EditableBlock>

                <EditableBlock
                    label={BLOCK_LABELS.goals}
                    onEdit={() => setBlock('goals')}
                    empty={goals.length === 0 && mainPoints.length === 0}
                >
                    {goals.length || mainPoints.length ? (
                        <AboutGoalsPointsSection goals={goals} mainPoints={mainPoints} />
                    ) : null}
                </EditableBlock>

                <EditableBlock label={BLOCK_LABELS.faq} onEdit={() => setBlock('faq')} empty={faq.length === 0}>
                    {faq.length ? <AboutFaqSection faqs={faq} /> : null}
                </EditableBlock>

                <AboutCtaBand />
            </div>

            {/* Block editor sheet */}
            <Sheet open={block != null} onOpenChange={(open) => !open && setBlock(null)}>
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl">
                    <SheetHeader>
                        <SheetTitle>{block ? BLOCK_LABELS[block] : ''}</SheetTitle>
                        <SheetDescription>Editing in {available.find((l) => l.code === editingLang)?.name ?? editingLang}.</SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4 p-4 pt-2" dir={dir}>
                        {block === 'hero' ? (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="page-title">Title</Label>
                                    <Input id="page-title" dir={dir} value={entry.title} onChange={(e) => setTitle(e.target.value)} />
                                </div>
                                <AboutSectionsEditor dir={dir} value={content} onChange={setContent} only={['intro']} />
                            </>
                        ) : null}

                        {block === 'body' ? (
                            <RichTextEditor key={`body-${editingLang}`} name={`body-${editingLang}`} value={entry.body} onChange={setBody} dir={dir} />
                        ) : null}

                        {block === 'settings' ? (
                            <>
                                <ImageUploadField label="Hero image" name="hero_image" value={heroImage} onChange={(v) => { setHeroImage(v); setDirty(true); }} />
                                <TextAreaField label="Video / embed" name="video_embed" value={video} onChange={(e) => { setVideo(e.target.value); setDirty(true); }} rows={4} className="font-mono text-xs" />
                                <CheckboxField label="Published" name="is_published" checked={published} onCheckedChange={(c) => { setPublished(c === true); setDirty(true); }} />
                            </>
                        ) : null}

                        {block && BLOCK_SECTION_KEYS[block] ? (
                            <AboutSectionsEditor dir={dir} value={content} onChange={setContent} only={BLOCK_SECTION_KEYS[block]} />
                        ) : null}
                    </div>

                    <div className="mt-auto flex justify-end p-4">
                        <Button type="button" onClick={() => setBlock(null)}>Done</Button>
                    </div>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}

function EditableBlock({
    label,
    onEdit,
    empty = false,
    children,
}: {
    label: string;
    onEdit: () => void;
    empty?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl outline-dashed outline-1 outline-transparent transition hover:outline-blue-300/70">
            <div className="mb-1 flex items-center justify-between px-1 py-1">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{label}</span>
                <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onEdit}>
                    ✎ Edit
                </Button>
            </div>
            {empty ? (
                <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                    Empty — click Edit to add content.
                </div>
            ) : (
                children
            )}
        </div>
    );
}
