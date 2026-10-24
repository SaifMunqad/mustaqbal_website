/**
 * Visual editor for the home page.
 *
 * Renders the real home page components and layers editing affordances on top:
 * add/reorder blocks, in-place text editing and per-block configuration. Edits are
 * collected as a local draft list and posted once, which keeps the preview honest
 * — the same components render for visitors and for the editor.
 */
import AppLayout from '@/layouts/app-layout';
import type { FormDataConvertible } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
    AvailableItem,
    TypeOption,
} from '@/components/dashboard/home-section-form';
import AddSectionSidebar from '@/components/dashboard/home-visual/add-section-sidebar';
import HomeBlockFrame from '@/components/dashboard/home-visual/home-block-frame';
import SectionConfigSheet from '@/components/dashboard/home-visual/section-config-sheet';
import SiteBlockPanel from '@/components/dashboard/home-visual/site-block-panel';
import TextEditDialog from '@/components/dashboard/home-visual/text-edit-dialog';
import {
    EMPTY_SITE_ENTRY,
    FIELD_LABELS,
    draftFromRaw,
    makeEmptyDraft,
    type DraftConfig,
    type HomePreview,
    type RawVisualSection,
    type SectionDraft,
    type SiteBlockKind,
    type SiteDraft,
    type SiteEntry,
    type TextFieldKey,
} from '@/components/dashboard/home-visual/types';
import FeatureGrid from '@/components/home/feature-grid';
import HomeHero from '@/components/home/home-hero';
import HomeSections, {
    type HomeSection,
    type HomeSectionEditApi,
} from '@/components/home/home-sections';
import LatestJobs from '@/components/home/latest-jobs';
import ProgramsHighlight from '@/components/home/programs-highlight';
import StatsBar from '@/components/home/stats-bar';
import type { Job } from '@/components/school/job-card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Program } from '@/components/school/program-card';
import type { LanguageOption, SharedData } from '@/types';

interface VisualProps {
    sections: RawVisualSection[];
    typeOptions: TypeOption[];
    availableItems: Record<string, AvailableItem[]>;
    site: SiteDraft;
    preview: HomePreview;
    [key: string]: unknown;
}

// The single localized field targeted by the click-to-edit dialog.
interface TextTarget {
    editorId: number;
    field: TextFieldKey;
}

export default function DashboardHomeSectionVisual() {
    const { sections, typeOptions, availableItems, site, preview } =
        usePage<VisualProps>().props;
    const { languages } = usePage<SharedData>().props;
    const { t } = useTranslation();

    const available: LanguageOption[] = languages?.available ?? [];
    const defaultCode = languages?.default ?? 'en';
    const languageName = (code: string) =>
        available.find((entry) => entry.code === code)?.name ?? code;
    const languageDir = (code: string): 'ltr' | 'rtl' =>
        available.find((entry) => entry.code === code)?.dir ?? 'ltr';

    const [drafts, setDrafts] = useState<SectionDraft[]>(() =>
        sections.map(draftFromRaw),
    );
    const [siteDraft, setSiteDraft] = useState<SiteDraft>(() => ({
        hero_image: site?.hero_image ?? '',
        translations: site?.translations ?? {},
    }));
    const [editingLang, setEditingLang] = useState<string>(defaultCode);
    const [dirty, setDirty] = useState(false);
    const [configEditorId, setConfigEditorId] = useState<number | null>(null);
    const [textTarget, setTextTarget] = useState<TextTarget | null>(null);
    const [sitePanel, setSitePanel] = useState<SiteBlockKind | null>(null);

    // Negative ids are handed to not-yet-saved blocks so every canvas section
    // has a stable numeric key for its edit handlers.
    const tempId = useRef(0);
    const nextTempId = () => --tempId.current;

    // Warn on tab close while there are unsaved edits.
    useEffect(() => {
        if (!dirty) {
            return;
        }
        const handler = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = true;
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    const patchDraft = (editorId: number, patch: Partial<SectionDraft>) => {
        setDrafts((prev) =>
            prev.map((draft) =>
                draft.editorId === editorId ? { ...draft, ...patch } : draft,
            ),
        );
        setDirty(true);
    };

    const move = (editorId: number, direction: -1 | 1) => {
        setDrafts((prev) => {
            const index = prev.findIndex(
                (draft) => draft.editorId === editorId,
            );
            const target = index + direction;
            if (index < 0 || target < 0 || target >= prev.length) {
                return prev;
            }
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
        setDirty(true);
    };

    const remove = (editorId: number) => {
        setDrafts((prev) =>
            prev.filter((draft) => draft.editorId !== editorId),
        );
        setDirty(true);
    };

    const addDraft = (option: TypeOption) => {
        setDrafts((prev) => [...prev, makeEmptyDraft(option, nextTempId())]);
        setDirty(true);
    };

    const setText = (editorId: number, field: TextFieldKey, value: string) => {
        const draft = drafts.find((entry) => entry.editorId === editorId);
        if (!draft) {
            return;
        }
        const forLang = { ...(draft.translations[editingLang] ?? {}) };
        if (value.trim() === '') {
            delete forLang[field];
        } else {
            forLang[field] = value;
        }
        const translations = { ...draft.translations, [editingLang]: forLang };
        patchDraft(editorId, { translations });
    };

    const patchConfig = (editorId: number, patch: Partial<DraftConfig>) => {
        const draft = drafts.find((entry) => entry.editorId === editorId);
        if (!draft) {
            return;
        }
        patchDraft(editorId, { config: { ...draft.config, ...patch } });
    };

    // Edit the currently selected language's slice of the Site Settings draft.
    const patchSiteEntry = (patch: Partial<SiteEntry>) => {
        setSiteDraft((prev) => {
            const current = prev.translations[editingLang] ?? EMPTY_SITE_ENTRY;
            return {
                ...prev,
                translations: {
                    ...prev.translations,
                    [editingLang]: { ...current, ...patch },
                },
            };
        });
        setDirty(true);
    };

    const patchSiteHeroImage = (url: string) => {
        setSiteDraft((prev) => ({ ...prev, hero_image: url }));
        setDirty(true);
    };

    const indexById = useMemo(() => {
        const map = new Map<number, number>();
        drafts.forEach((draft, index) => map.set(draft.editorId, index));
        return map;
    }, [drafts]);

    const editApi: HomeSectionEditApi = {
        editText: (editorId, field) => setTextTarget({ editorId, field }),
        configure: (editorId) => setConfigEditorId(editorId),
        toggleActive: (editorId) => {
            const draft = drafts.find((entry) => entry.editorId === editorId);
            if (draft) {
                patchDraft(editorId, { is_active: !draft.is_active });
            }
        },
        move,
        remove,
        isFirst: (editorId) => (indexById.get(editorId) ?? 0) === 0,
        isLast: (editorId) =>
            (indexById.get(editorId) ?? 0) === drafts.length - 1,
    };

    // Build the render-ready sections for the currently selected editing
    // language. Fallback-free: blank unless that language has its own text.
    const rendered: HomeSection[] = drafts.map((draft) => {
        const text = draft.translations[editingLang] ?? {};
        const base: HomeSection = {
            id: draft.editorId,
            type: draft.section_type,
            variant: draft.variant,
            kind: draft.kind,
            is_active: draft.is_active,
            type_label: draft.type_label,
        };

        if (draft.kind === 'curated') {
            return {
                ...base,
                title: text.title ?? '',
                items: draft.preview_items,
            };
        }

        return {
            ...base,
            title: text.title ?? '',
            config: {
                heading: text.heading ?? '',
                body: text.body ?? '',
                image_url: draft.config.image_url || null,
                cta_label: text.cta_label ?? '',
                cta_url: draft.config.cta_url || null,
                tone: draft.config.tone,
            },
        };
    });

    // Derived Site Settings display values for the currently editing language.
    const siteEntry: SiteEntry =
        siteDraft.translations[editingLang] ?? EMPTY_SITE_ENTRY;
    const heroHome = {
        title: siteEntry.home_title,
        subtitle: siteEntry.home_subtitle,
        cta_primary: siteEntry.home_cta_primary,
        cta_secondary: siteEntry.home_cta_secondary,
        hero_image: siteDraft.hero_image,
    };

    const configDraft =
        configEditorId == null
            ? null
            : (drafts.find((draft) => draft.editorId === configEditorId) ??
              null);

    const targetDraft = textTarget
        ? (drafts.find((draft) => draft.editorId === textTarget.editorId) ??
          null)
        : null;

    const save = () => {
        router.put(
            '/dashboard/home-sections/visual',
            {
                sections: drafts.map((draft) => ({
                    id: draft.id,
                    section_type: draft.section_type,
                    is_active: draft.is_active,
                    limit: draft.limit,
                    config: draft.config,
                    translations: draft.translations,
                })),
                site: {
                    hero_image: siteDraft.hero_image,
                    translations: siteDraft.translations,
                } as unknown as FormDataConvertible,
            },
            {
                preserveScroll: true,
                onSuccess: () => setDirty(false),
            },
        );
    };

    const revert = () => {
        setDrafts(sections.map(draftFromRaw));
        setSiteDraft({
            hero_image: site?.hero_image ?? '',
            translations: site?.translations ?? {},
        });
        setDirty(false);
    };

    const currentDir = languageDir(editingLang);
    const isDefaultLang = editingLang === defaultCode;

    // Localized labels for the built-in canvas blocks and their Edit button.
    const blockLabel = (key: string) =>
        t(`dashboard.homeSections.visual.blocks.${key}`);
    const editLabel = t('dashboard.homeSections.visual.edit');

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                {
                    title: t('dashboard.homeSections.title'),
                    href: '/dashboard/home-sections',
                },
                {
                    title: t('dashboard.homeSections.visual.visualEditor'),
                    href: '/dashboard/home-sections/visual',
                },
            ]}
        >
            <Head title={t('dashboard.homeSections.visual.headTitle')} />

            {/* Sticky admin toolbar: language + save controls, hidden from visitors. */}
            <div className="sticky top-0 z-40 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                            {t('dashboard.homeSections.visual.editLanguage')}
                        </span>
                        <Select
                            value={editingLang}
                            onValueChange={setEditingLang}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {available.map((option) => (
                                    <SelectItem
                                        key={option.code}
                                        value={option.code}
                                    >
                                        {option.name}
                                        {option.code === defaultCode
                                            ? ' *'
                                            : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {!isDefaultLang ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            {t('dashboard.homeSections.visual.fallbackNote', {
                                lang: languageName(editingLang),
                                def: languageName(defaultCode),
                            })}
                        </span>
                    ) : null}

                    <div className="ms-auto flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={revert}
                            disabled={!dirty}
                        >
                            {t('dashboard.homeSections.visual.revert')}
                        </Button>
                        <Button
                            size="sm"
                            type="button"
                            onClick={save}
                            disabled={!dirty}
                        >
                            {t('dashboard.homeSections.visual.save')}
                            {dirty ? ' •' : ''}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 px-1 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div
                    className="mx-auto w-full max-w-6xl space-y-8 pb-16 lg:order-first"
                    dir={currentDir}
                    // The RTL font stack normally switches on via `html[dir='rtl']`,
                    // which a nested `dir` can't trigger, so apply the matching font
                    // here too. The preview then reads naturally in the edited language.
                    style={{
                        fontFamily:
                            currentDir === 'rtl'
                                ? 'var(--app-font-rtl)'
                                : 'var(--app-font-ltr)',
                    }}
                >
                <HomeBlockFrame
                    label={blockLabel('hero')}
                    editLabel={editLabel}
                    onEdit={() => setSitePanel('hero')}
                >
                    <HomeHero
                        home={heroHome}
                        tagline={siteEntry.tagline}
                        rtl={currentDir === 'rtl'}
                    />
                </HomeBlockFrame>

                <HomeBlockFrame
                    label={blockLabel('programs')}
                    note={blockLabel('programsNote')}
                >
                    <ProgramsHighlight
                        programs={
                            (preview?.programs ?? []) as unknown as Program[]
                        }
                    />
                </HomeBlockFrame>

                <HomeBlockFrame
                    label={blockLabel('features')}
                    editLabel={editLabel}
                    onEdit={() => setSitePanel('features')}
                >
                    <FeatureGrid features={siteEntry.home_features} />
                </HomeBlockFrame>

                <HomeBlockFrame
                    label={blockLabel('stats')}
                    editLabel={editLabel}
                    onEdit={() => setSitePanel('stats')}
                >
                    <StatsBar stats={siteEntry.home_stats} />
                </HomeBlockFrame>

                <HomeBlockFrame
                    label={blockLabel('jobs')}
                    note={blockLabel('jobsNote')}
                >
                    <LatestJobs
                        jobs={(preview?.jobs ?? []) as unknown as Job[]}
                    />
                </HomeBlockFrame>

                {rendered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                        {t('dashboard.homeSections.visual.noBlocks')}
                    </div>
                ) : (
                    <HomeSections sections={rendered} edit={editApi} />
                )}
                </div>

                <AddSectionSidebar
                    typeOptions={typeOptions}
                    onAdd={addDraft}
                />
            </div>

            <SectionConfigSheet
                open={configEditorId != null}
                onOpenChange={(open) => !open && setConfigEditorId(null)}
                draft={configDraft}
                candidates={
                    configDraft
                        ? (availableItems[configDraft.section_type] ?? [])
                        : []
                }
                onPatchConfig={(patch) =>
                    configDraft && patchConfig(configDraft.editorId, patch)
                }
                onPatchLimit={(limit) =>
                    configDraft && patchDraft(configDraft.editorId, { limit })
                }
            />

            <TextEditDialog
                key={`${textTarget?.editorId ?? 'none'}-${textTarget?.field ?? 'none'}-${editingLang}`}
                open={textTarget != null}
                onOpenChange={(open) => !open && setTextTarget(null)}
                label={textTarget ? FIELD_LABELS[textTarget.field] : ''}
                languageName={languageName(editingLang)}
                dir={currentDir}
                multiline={textTarget?.field === 'body'}
                value={
                    textTarget && targetDraft
                        ? (targetDraft.translations[editingLang]?.[
                              textTarget.field
                          ] ?? '')
                        : ''
                }
                untranslatedHint={
                    !isDefaultLang
                        ? `This language has no text yet. Leaving it blank means the live site shows the ${languageName(
                              defaultCode,
                          )} version — save to add ${languageName(editingLang)}.`
                        : undefined
                }
                onSave={(value) =>
                    textTarget &&
                    setText(textTarget.editorId, textTarget.field, value)
                }
            />

            <SiteBlockPanel
                key={`${sitePanel ?? 'none'}-${editingLang}`}
                open={sitePanel != null}
                onClose={() => setSitePanel(null)}
                kind={sitePanel ?? 'hero'}
                dir={currentDir}
                entry={siteEntry}
                heroImage={siteDraft.hero_image}
                onPatch={patchSiteEntry}
                onHeroImage={patchSiteHeroImage}
                languages={available}
                activeLang={editingLang}
                defaultCode={defaultCode}
                onLangChange={setEditingLang}
            />

            <p className="mt-4 text-center text-xs text-muted-foreground">
                <Link href="/dashboard/home-sections" className="underline">
                    {t('dashboard.homeSections.visual.useListEditor')}
                </Link>
            </p>
        </AppLayout>
    );
}
