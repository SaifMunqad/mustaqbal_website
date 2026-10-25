/**
 * Unified page builder for the home page.
 *
 * The whole layout — ordered sections, their per-language text, media and config —
 * is edited in one place and committed in a single staged save (`save_url`), so a
 * reorder plus a copy edit never becomes two conflicting requests. Adding, moving
 * and configuring blocks happens against the same draft the live preview renders.
 */
import AppLayout from '@/layouts/app-layout';
import type { FormDataConvertible } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import i18n from '@/i18n';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useDroppable,
    useDraggable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    ArrowDown,
    ArrowUp,
    Copy,
    Eye,
    EyeOff,
    GripVertical,
    Menu,
    Monitor,
    Plus,
    Smartphone,
    Tablet,
    Trash2,
    X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import RichTextEditor from '@/components/editor/rich-text-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/form/image-upload-field';
import { HomeBlock, type RenderBlock, type BlockListRow } from '@/components/home/page-block';
import {
    hasRowContent,
    placeholderContent,
    placeholderImage,
    previewField,
    sampleRows,
} from '@/components/home/preview-placeholders';
import { ICON_OPTIONS, resolveIcon } from '@/lib/icon-map';
import type { LanguageOption, SharedData } from '@/types';

// ---------------------------------------------------------------------------
// Types mirroring the controller's fallback-free draft feed.
// ---------------------------------------------------------------------------

interface PaletteOption {
    value: string;
    label: string;
    labelKey: string;
    kind: 'curated' | 'authored';
    component: string;
    list_group: string | null;
    category: string;
    maxInstances: number | null;
    addable: boolean;
}

interface ListRow {
    value: string;
    title: string;
    description: string;
    icon: string;
    image_path: string;
    url: string;
}

interface SectionDraft {
    editorId: number;
    key: string;
    id: number | null;
    section_type: string;
    type_label: string;
    label_key: string;
    kind: 'curated' | 'authored';
    component: string;
    zone: string;
    is_active: boolean;
    limit: number | null;
    columns: number | null;
    image_path: string;
    cta_url: string;
    tone: string;
    span_lg: number | null;
    span_md: number | null;
    span_sm: number | null;
    config: Record<string, unknown>;
    stores: string[];
    list_group: string | null;
    translations: Record<string, Record<string, string>>;
    items: { id: number }[];
    lists: Record<string, Record<string, ListRow[]>>;
}

interface RawSection {
    id: number;
    section_type: string;
    type_label: string;
    label_key: string;
    kind: 'curated' | 'authored';
    component: string;
    zone: string;
    is_active: boolean;
    limit: number | null;
    columns: number | null;
    image_path: string;
    cta_url: string;
    tone: string;
    span_lg: number | null;
    span_md: number | null;
    span_sm: number | null;
    config: Record<string, unknown>;
    stores: string[];
    list_group: string | null;
    translations: Record<string, Record<string, string>>;
    items: { id: number; type: string }[];
    lists: Record<string, Record<string, ListRow[]>>;
}

interface BuilderPage {
    key: string;
    label: string;
    /** i18n key for the page label (English `label` is the fallback). */
    label_key: string;
    /** Endpoint the staged layout is committed to. */
    save_url: string;
    /** Parent screen linked from the breadcrumb; null when the page has none. */
    index_url: string | null;
    /** Canonical builder URL for this page. */
    visual_url: string;
}

interface BuilderProps {
    page: BuilderPage;
    sections: RawSection[];
    palette: PaletteOption[];
    categories: { value: string; label: string; labelKey: string }[];
    availableItems: Record<string, { id: number; label: string }[]>;
    defaultLanguage: string;
    [key: string]: unknown;
}

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

// ---------------------------------------------------------------------------
// Draft helpers
// ---------------------------------------------------------------------------

function draftFromRaw(s: RawSection): SectionDraft {
    return { ...s, editorId: s.id, key: `s-${s.id}` };
}

function emptyListRow(): ListRow {
    return { value: '', title: '', description: '', icon: '', image_path: '', url: '' };
}

function makeDraft(option: PaletteOption, editorId: number): SectionDraft {
    return {
        editorId,
        key: `new-${editorId}`,
        id: null,
        section_type: option.value,
        type_label: option.label,
        label_key: option.labelKey,
        kind: option.kind,
        component: option.component,
        zone: 'main',
        is_active: true,
        limit: null,
        columns: null,
        image_path: '',
        cta_url: '',
        tone: 'default',
        span_lg: null,
        span_md: null,
        span_sm: null,
        config: {},
        stores: [],
        list_group: option.list_group,
        translations: {},
        items: [],
        lists: {},
    };
}

// Hard-coded, per-type responsive spans (mirror of SectionType::defaultSpans()).
// Users can't edit these so the responsive layout can never be broken by hand.
function defaultSpans(component: string): { lg: number; md: number; sm: number } {
    if (component === 'quote' || component === 'newsletter' || component === 'countdown') {
        return { lg: 6, md: 12, sm: 12 };
    }
    return { lg: 12, md: 12, sm: 12 };
}

function spanBucket(device: PreviewDevice): 'sm' | 'md' | 'lg' {
    return device === 'mobile' ? 'sm' : device === 'tablet' ? 'md' : 'lg';
}

function spanFor(draft: SectionDraft, device: PreviewDevice): number {
    const stored =
        device === 'mobile'
            ? draft.span_sm
            : device === 'tablet'
              ? draft.span_md
              : draft.span_lg;

    return stored ?? defaultSpans(draft.component)[spanBucket(device)];
}

export function PageBuilderEditor() {
    const { page, sections, palette, categories, availableItems, defaultLanguage } =
        usePage<BuilderProps>().props;
    const { languages } = usePage<SharedData>().props;
    const { t } = useTranslation();

    const available: LanguageOption[] = languages?.available ?? [];

    const [drafts, setDrafts] = useState<SectionDraft[]>(() =>
        sections.map(draftFromRaw),
    );
    const [editingLang, setEditingLang] = useState<string>(defaultLanguage);
    const [dirty, setDirty] = useState(false);
    const [device, setDevice] = useState<PreviewDevice>('desktop');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragOption, setDragOption] = useState<PaletteOption | null>(null);
    const [editingEditorId, setEditingEditorId] = useState<number | null>(null);
    const [paletteOpen, setPaletteOpen] = useState(false);

    const tempId = useRef(0);
    const nextTempId = () => --tempId.current;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    useEffect(() => {
        if (!dirty) return;
        const handler = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = true;
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    const dir = languages?.available?.find((l) => l.code === editingLang)?.dir ?? 'ltr';

    const patchDraft = (editorId: number, patch: Partial<SectionDraft>) => {
        setDrafts((prev) =>
            prev.map((d) => (d.editorId === editorId ? { ...d, ...patch } : d)),
        );
        setDirty(true);
    };

    const setText = (editorId: number, field: string, value: string) => {
        const draft = drafts.find((d) => d.editorId === editorId);
        if (!draft) return;
        const forLang = { ...(draft.translations[editingLang] ?? {}) };
        if (value.trim() === '') delete forLang[field];
        else forLang[field] = value;
        patchDraft(editorId, { translations: { ...draft.translations, [editingLang]: forLang } });
    };

    const removeDraft = (editorId: number) => {
        setDrafts((prev) => prev.filter((d) => d.editorId !== editorId));
        setDirty(true);
    };

    // Copy a block (and every nested store) right after the original, so an
    // admin can build a page from a repeated pattern without re-typing it.
    const duplicateDraft = (editorId: number) => {
        const index = drafts.findIndex((d) => d.editorId === editorId);
        if (index < 0) {
            return;
        }

        const source = drafts[index];
        const copyId = nextTempId();
        const copy: SectionDraft = {
            ...source,
            editorId: copyId,
            key: `new-${copyId}`,
            id: null,
            config: { ...source.config },
            translations: Object.fromEntries(
                Object.entries(source.translations).map(([code, fields]) => [
                    code,
                    { ...fields },
                ]),
            ),
            lists: Object.fromEntries(
                Object.entries(source.lists).map(([group, byLang]) => [
                    group,
                    Object.fromEntries(
                        Object.entries(byLang).map(([code, rows]) => [
                            code,
                            rows.map((row) => ({ ...row })),
                        ]),
                    ),
                ]),
            ),
            items: source.items.map((item) => ({ ...item })),
        };

        setDrafts((prev) => {
            const at = prev.findIndex((d) => d.editorId === editorId);
            if (at < 0) {
                return prev;
            }
            const next = [...prev];
            next.splice(at + 1, 0, copy);
            return next;
        });
        setDirty(true);
        setEditingEditorId(copyId);
    };

    const toggleActive = (editorId: number) => {
        const draft = drafts.find((d) => d.editorId === editorId);
        if (draft) patchDraft(editorId, { is_active: !draft.is_active });
    };

    // Tap-to-add from the palette drawer (drag still works from the sidebar).
    const appendDraft = (option: PaletteOption) => {
        setDrafts((prev) => [...prev, makeDraft(option, nextTempId())]);
        setDirty(true);
        setPaletteOpen(false);
    };

    const onDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
        setDragOption(
            (event.active.data.current?.option as PaletteOption) ?? null,
        );
    };

    const onDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        setDragOption(null);
        const { active, over } = event;
        if (!over) return;

        // Drop a new block from the palette at the resolved slot.
        if (active.data.current?.from === 'palette') {
            const option = active.data.current.option as PaletteOption;
            const newDraft = makeDraft(option, nextTempId());
            setDrafts((prev) => {
                const next = [...prev];
                let index = next.length;
                if (String(over.id) !== 'canvas') {
                    const at = next.findIndex((d) => d.editorId === Number(over.id));
                    if (at >= 0) index = at;
                }
                next.splice(index, 0, newDraft);
                return next;
            });
            setDirty(true);
            return;
        }

        // Reorder existing blocks (swap whole positions → never overlap).
        const oldIndex = drafts.findIndex((d) => d.editorId === Number(active.id));
        const newIndex = drafts.findIndex((d) => d.editorId === Number(over.id));
        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
            setDrafts((prev) => arrayMove(prev, oldIndex, newIndex));
            setDirty(true);
        }
    };

    const save = () => {
        router.put(
            page.save_url,
            {
                sections: drafts.map(
                    (d) => ({
                        id: d.id,
                        section_type: d.section_type,
                        zone: d.zone,
                        is_active: d.is_active,
                        limit: d.limit,
                        columns: d.columns,
                        image_path: d.image_path || null,
                        cta_url: d.cta_url || null,
                        tone: d.tone,
                        span_lg: d.span_lg,
                        span_md: d.span_md,
                        span_sm: d.span_sm,
                        config: d.config,
                        items: d.items,
                        lists: d.lists,
                        translations: d.translations,
                    }),
                ) as unknown as FormDataConvertible,
            },
            { preserveScroll: true, onSuccess: () => setDirty(false) },
        );
    };

    const editingDraft =
        editingEditorId == null
            ? null
            : drafts.find((d) => d.editorId === editingEditorId) ?? null;

    const counts = useMemo(() => {
        const map: Record<string, number> = {};
        drafts.forEach((d) => {
            map[d.section_type] = (map[d.section_type] ?? 0) + 1;
        });
        return map;
    }, [drafts]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                // Pages without a dedicated settings screen (e.g. Contact) skip
                // the parent crumb instead of linking to themselves.
                ...(page.index_url
                    ? [{ title: t(page.label_key, page.label), href: page.index_url }]
                    : []),
                {
                    title: t(
                        'dashboard.homeSections.visual.visualEditor',
                        'Visual editor',
                    ),
                    href: page.visual_url,
                },
            ]}
        >
            <Head title={t(page.label_key, page.label)} />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
            >
                <div className="sticky top-0 z-40 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">
                                {t('dashboard.homeSections.visual.editLanguage')}
                            </Label>
                            <Select value={editingLang} onValueChange={setEditingLang}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {available.map((option) => (
                                        <SelectItem key={option.code} value={option.code}>
                                            {option.name}
                                            {option.code === defaultLanguage ? ' *' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1">
                            {(['desktop', 'tablet', 'mobile'] as PreviewDevice[]).map((d) => {
                                const Icon =
                                    d === 'desktop'
                                        ? Monitor
                                        : d === 'tablet'
                                          ? Tablet
                                          : Smartphone;
                                return (
                                    <Button
                                        key={d}
                                        size="sm"
                                        variant={device === d ? 'default' : 'ghost'}
                                        type="button"
                                        title={d}
                                        aria-label={d}
                                        onClick={() => setDevice(d)}
                                    >
                                        <Icon className="size-4" />
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Opens the palette as a drawer on small screens. */}
                        <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            className="lg:hidden"
                            onClick={() => setPaletteOpen(true)}
                        >
                            <Menu className="size-4" />
                            {t('dashboard.homeSections.visual.blocksTitle', 'Blocks')}
                        </Button>

                        <div className="ms-auto flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                onClick={() => setDrafts(sections.map(draftFromRaw))}
                                disabled={!dirty}
                            >
                                {t('dashboard.homeSections.visual.revert')}
                            </Button>
                            <Button size="sm" type="button" onClick={save} disabled={!dirty}>
                                {t('dashboard.homeSections.visual.save')}
                                {dirty ? ' •' : ''}
                            </Button>
                        </div>
                    </div>
                </div>

                {paletteOpen ? (
                    <div
                        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                        onClick={() => setPaletteOpen(false)}
                    />
                ) : null}

                {/* dir follows the editing language so the palette mirrors to the
                    left (and the drawer slides from the left) in RTL. */}
                <div dir={dir} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    {/* Palette: on lg+ it flows with the page scroll; below lg it's
                        a slide-in drawer with its own scroll. */}
                    <aside
                        className={`fixed inset-y-0 z-50 flex w-80 flex-col overflow-y-auto bg-background p-4 shadow-xl transition-transform ltr:end-0 rtl:start-0 lg:static lg:z-auto lg:order-last lg:h-auto lg:w-auto lg:self-start lg:overflow-visible lg:bg-transparent lg:p-2 lg:shadow-none ${
                            paletteOpen
                                ? 'max-lg:visible max-lg:translate-x-0'
                                : 'max-lg:invisible max-lg:ltr:translate-x-full max-lg:rtl:-translate-x-full'
                        }`}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-muted-foreground">
                                {t('dashboard.homeSections.visual.blocksTitle', 'Blocks')}
                            </h2>
                            <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                className="lg:hidden"
                                onClick={() => setPaletteOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                        {(categories.length > 0
                            ? categories
                            : [{ value: '', label: 'Blocks', labelKey: '' }]
                        ).map((cat) => {
                            const items = palette.filter((o) =>
                                cat.value ? o.category === cat.value : true,
                            );
                            if (items.length === 0) return null;
                            return (
                                <div key={cat.value || 'all'} className="mb-5">
                                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                        {cat.labelKey
                                            ? t(cat.labelKey, cat.label)
                                            : cat.label}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 lg:grid-cols-1">
                                        {items.map((option) => {
                                            const capped =
                                                option.maxInstances !== null &&
                                                (counts[option.value] ?? 0) >=
                                                    option.maxInstances;
                                            return (
                                                <PaletteChip
                                                    key={option.value}
                                                    option={option}
                                                    disabled={capped}
                                                    onSelect={appendDraft}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </aside>

                    {/* Canvas: single ordered, responsive, non-overlapping flow. */}
                    <div
                        dir={dir}
                        className="mx-auto w-full p-2 transition-all lg:order-first"
                        style={{
                            maxWidth:
                                device === 'mobile'
                                    ? '375px'
                                    : device === 'tablet'
                                      ? '768px'
                                      : '100%',
                            fontFamily:
                                dir === 'rtl'
                                    ? 'var(--app-font-rtl)'
                                    : 'var(--app-font-ltr)',
                        }}
                    >
                        <SortableBlocks
                            drafts={drafts}
                            device={device}
                            editingLang={editingLang}
                            rtl={dir === 'rtl'}
                            editingId={editingEditorId}
                            availableItems={availableItems}
                            onEdit={setEditingEditorId}
                            onRemove={removeDraft}
                            onToggleActive={toggleActive}
                        />
                    </div>
                </div>

                <DragOverlay>
                    {activeId && dragOption ? (
                        <div className="rounded-lg border border-dashed border-blue-400 bg-background px-3 py-2 text-sm shadow-lg">
                            {t(dragOption.labelKey, dragOption.label)}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <BlockEditorSheet
                draft={editingDraft}
                open={editingEditorId != null}
                onClose={() => setEditingEditorId(null)}
                editingLang={editingLang}
                dir={dir}
                candidates={
                    editingDraft ? (availableItems[editingDraft.section_type] ?? []) : []
                }
                onPatch={patchDraft}
                onPatchText={setText}
                onRemove={(id) => {
                    removeDraft(id);
                    setEditingEditorId(null);
                }}
                onDuplicate={duplicateDraft}
                onToggleActive={toggleActive}
            />
        </AppLayout>
    );
}

// ---------------------------------------------------------------------------
// Palette chip (draggable)
// ---------------------------------------------------------------------------

function PaletteChip({
    option,
    disabled,
    onSelect,
}: {
    option: PaletteOption;
    disabled: boolean;
    onSelect: (option: PaletteOption) => void;
}) {
    const { t } = useTranslation();
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette:${option.value}`,
        data: { from: 'palette', option },
        disabled,
    });

    const label = t(option.labelKey, option.label);

    return (
        <button
            ref={setNodeRef}
            type="button"
            {...listeners}
            {...attributes}
            disabled={disabled}
            // Drag adds it in the sidebar; a plain tap adds it (needed for the drawer).
            onClick={() => {
                if (!disabled) onSelect(option);
            }}
            className={`w-full overflow-hidden rounded-lg border text-start transition ${
                disabled
                    ? 'cursor-not-allowed border-border/50 opacity-50'
                    : 'cursor-grab border-border bg-card hover:border-blue-400 hover:shadow-sm'
            } ${isDragging ? 'opacity-40' : ''}`}
        >
            <BlockSkeleton component={option.component} />
            <span className="block px-3 py-1.5 text-xs font-medium">{label}</span>
        </button>
    );
}

// A tiny wireframe of each block family so the admin sees the shape they're
// about to drop, not just its name.
function BlockSkeleton({ component }: { component: string }) {
    const bar = 'rounded bg-muted-foreground/20';
    const box = 'rounded bg-muted-foreground/15';
    const grid = (n: number, cls: string) =>
        Array.from({ length: n }).map((_, i) => <div key={i} className={cls} />);

    const body: Record<string, React.ReactNode> = {
        hero: (
            <div className="flex gap-1">
                <div className={`h-8 w-1/2 ${box}`} />
                <div className="flex flex-1 flex-col justify-center gap-1">
                    <div className={`h-1.5 w-full ${bar}`} />
                    <div className={`h-1.5 w-2/3 ${bar}`} />
                </div>
            </div>
        ),
        cards: (
            <div className="grid grid-cols-3 gap-1">{grid(3, `h-8 ${box}`)}</div>
        ),
        list: <div className="grid grid-cols-2 gap-1">{grid(4, `h-6 ${box}`)}</div>,
        logos: <div className="flex items-center justify-between">{grid(5, `h-4 w-6 ${bar}`)}</div>,
        gallery: (
            <div className="grid grid-cols-3 gap-1">{grid(6, `h-5 ${box}`)}</div>
        ),
        faq: (
            <div className="space-y-1">
                {grid(3, `h-3 w-full ${bar}`)}
            </div>
        ),
        social: <div className="flex gap-1">{grid(4, `h-4 w-8 ${bar}`)}</div>,
        contact: (
            <div className="flex gap-1">
                <div className="flex flex-1 flex-col gap-1">{grid(3, `h-2 ${bar}`)}</div>
                <div className={`h-10 w-1/2 ${box}`} />
            </div>
        ),
        stats: <div className="flex justify-between gap-1">{grid(4, `h-6 flex-1 ${box}`)}</div>,
        stats_cards: (
            <div className="grid grid-cols-2 gap-1">{grid(4, `h-6 ${box}`)}</div>
        ),
        features: (
            <div className="grid grid-cols-2 gap-1">{grid(4, `h-5 ${box}`)}</div>
        ),
        icon_cards: (
            <div className="grid grid-cols-3 gap-1">{grid(3, `h-8 ${box}`)}</div>
        ),
        rich_text: (
            <div className="space-y-1">
                <div className={`h-1.5 w-full ${bar}`} />
                <div className={`h-1.5 w-5/6 ${bar}`} />
                <div className={`h-1.5 w-2/3 ${bar}`} />
            </div>
        ),
        cta: <div className={`h-8 w-full ${box}`} />,
        announcement: <div className={`h-5 w-full ${bar}`} />,
        banner: (
            <div className="space-y-1">
                <div className={`h-3 w-2/3 ${bar}`} />
                <div className={`h-6 w-full ${box}`} />
            </div>
        ),
        quote: (
            <div className="space-y-1 py-1">
                <div className={`mx-auto h-1.5 w-3/4 ${bar}`} />
                <div className={`mx-auto h-1.5 w-1/2 ${bar}`} />
            </div>
        ),
        media_text: (
            <div className="flex gap-1">
                <div className={`h-8 w-1/2 ${box}`} />
                <div className="flex flex-1 flex-col justify-center gap-1">
                    <div className={`h-1.5 w-full ${bar}`} />
                </div>
            </div>
        ),
        video: (
            <div className="relative h-10 w-full rounded bg-muted-foreground/15">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-y-4 border-l-6 border-y-transparent border-l-white" />
            </div>
        ),
        map: <div className={`h-9 w-full ${box}`} />,
        newsletter: (
            <div className="flex gap-1">
                <div className={`h-4 flex-1 ${bar}`} />
                <div className={`h-4 w-8 ${box}`} />
            </div>
        ),
        countdown: <div className="flex justify-center gap-1">{grid(4, `h-6 w-6 ${box}`)}</div>,
        programs: (
            <div className="grid grid-cols-2 gap-1">{grid(2, `h-8 ${box}`)}</div>
        ),
        jobs: (
            <div className="space-y-1">{grid(3, `h-3 w-full ${bar}`)}</div>
        ),
        contact_form: (
            <div className="space-y-1">
                <div className={`h-2 w-1/3 ${bar}`} />
                {grid(2, `h-3 w-full ${box}`)}
                <div className={`h-3 w-1/2 ${box}`} />
            </div>
        ),
        contact_details: (
            <div className="flex gap-1">
                <div className="flex flex-1 flex-col gap-1">
                    {grid(3, `h-2 ${bar}`)}
                </div>
                <div className={`h-10 w-1/3 ${box}`} />
            </div>
        ),
    };

    return (
        <div className="h-16 w-full border-b border-border bg-muted/40 p-2">
            {body[component] ?? <div className={`h-full w-full ${box}`} />}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Sortable canvas
// ---------------------------------------------------------------------------

function SortableBlocks({
    drafts,
    device,
    editingLang,
    rtl,
    editingId,
    availableItems,
    onEdit,
    onRemove,
    onToggleActive,
}: {
    drafts: SectionDraft[];
    device: PreviewDevice;
    editingLang: string;
    rtl: boolean;
    editingId: number | null;
    availableItems: Record<string, { id: number; label: string }[]>;
    onEdit: (id: number) => void;
    onRemove: (id: number) => void;
    onToggleActive: (id: number) => void;
}) {
    const { setNodeRef } = useDroppable({ id: 'canvas' });
    const { t } = useTranslation();

    if (drafts.length === 0) {
        return (
            <div
                ref={setNodeRef}
                className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground"
            >
                {t('dashboard.homeSections.visual.noBlocks', 'Drag a block from the palette.')}
            </div>
        );
    }

    return (
        <div ref={setNodeRef} className="space-y-4">
            <SortableContext
                items={drafts.map((d) => d.editorId)}
                strategy={rectSortingStrategy}
            >
                <div className="page-grid">
                    {drafts.map((draft) => (
                        <SortableBlock
                            key={draft.key}
                            draft={draft}
                            device={device}
                            editingLang={editingLang}
                            rtl={rtl}
                            isEditing={editingId === draft.editorId}
                            available={availableItems[draft.section_type] ?? []}
                            onEdit={onEdit}
                            onRemove={onRemove}
                            onToggleActive={onToggleActive}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

function SortableBlock({
    draft,
    device,
    editingLang,
    rtl,
    isEditing,
    available,
    onEdit,
    onRemove,
    onToggleActive,
}: {
    draft: SectionDraft;
    device: PreviewDevice;
    editingLang: string;
    rtl: boolean;
    isEditing: boolean;
    available: { id: number; label: string }[];
    onEdit: (id: number) => void;
    onRemove: (id: number) => void;
    onToggleActive: (id: number) => void;
}) {
    const { t } = useTranslation();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: draft.editorId });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: `span ${spanFor(draft, device)}`,
        minWidth: 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            // `isolate` gives every block its own stacking context, so a block's
            // internal z-index can never paint over another block's controls.
            className={`isolate group relative rounded-xl outline outline-2 outline-transparent transition ${
                isDragging ? 'z-10 opacity-60' : ''
            } ${isEditing ? 'outline-blue-500' : 'hover:outline-blue-300'}`}
        >
            {/* Toolbar: reveals on block hover (Tailwind `group-hover`) to keep the
                canvas clean, staying visible while editing or focused so the
                buttons remain reachable. It's stacked ABOVE the block's own
                layers because hero/split-hero paint their copy (and links) at
                z-10 right under this bar, which used to swallow every click.
                z-30 here keeps drag/edit/hide/remove reachable on every block.
                `pointer-events-none` while hidden stops the invisible bar from
                stealing clicks; `group-hover`/`focus-within` re-enable it. */}
            <div
                className={`absolute -top-3 z-30 flex items-center gap-1 rounded-lg border border-border bg-background/75 px-1 py-0.5 shadow-sm backdrop-blur-sm transition focus-within:ring-2 focus-within:ring-blue-400 ltr:left-2 rtl:right-2 ${
                    isEditing
                        ? ''
                        : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100'
                }`}
            >
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted"
                    aria-label={t(
                        'dashboard.homeSections.visual.actions.dragToReorder',
                        'Drag to reorder',
                    )}
                >
                    <GripVertical className="size-4" />
                </button>
                <span className="max-w-[160px] truncate text-xs font-medium">
                    {t(draft.label_key, draft.type_label)}
                </span>
                <button
                    type="button"
                    onClick={() => onToggleActive(draft.editorId)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                    title={
                        draft.is_active
                            ? t('dashboard.homeSections.visual.status.visible', 'Visible')
                            : t('dashboard.homeSections.visual.status.hidden', 'Hidden')
                    }
                >
                    {draft.is_active ? (
                        <Eye className="size-4" />
                    ) : (
                        <EyeOff className="size-4" />
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => onEdit(draft.editorId)}
                    className="rounded px-1.5 py-1 text-xs font-medium hover:bg-muted"
                >
                    {t('dashboard.homeSections.visual.edit', 'Edit')}
                </button>
                <button
                    type="button"
                    onClick={() => onRemove(draft.editorId)}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    title={t('dashboard.homeSections.visual.actions.remove', 'Remove')}
                >
                    <Trash2 className="size-4" />
                </button>
            </div>

            {/* Preview: the real component, rendered inert. That keeps links,
                buttons and inputs from reacting to clicks or keyboard focus, so
                a stray hit on a hero CTA can no longer navigate away from the
                editor (dropping unsaved edits) or steal clicks from the bar. */}
            <div
                className={`relative ${draft.is_active ? '' : 'opacity-40'}`}
                inert
            >
                <HomeBlock
                    block={draftToRenderBlock(
                        draft,
                        editingLang,
                        draft.id === null && !hasContent(draft, editingLang),
                        available,
                    )}
                    rtl={rtl}
                />
            </div>
        </div>
    );
}

function hasContent(draft: SectionDraft, lang: string): boolean {
    const t = draft.translations[lang] ?? {};
    const group = draft.list_group;
    const hasRows = group
        ? (draft.lists[group]?.[lang] ?? []).some(
              (r) => r.title || r.value || r.description || r.image_path,
          )
        : false;
    // Config-only blocks (video URL, map embed, countdown date, …) keep all of
    // their content in `config`, so a filled-in setting counts as authored and
    // turns the sample scaffolding off.
    const hasConfig = Object.values(draft.config ?? {}).some((value) =>
        typeof value === 'string' ? value.trim() !== '' : value != null,
    );
    return Boolean(
        t.title ||
            t.heading ||
            t.body ||
            draft.image_path ||
            draft.cta_url ||
            hasRows ||
            hasConfig,
    );
}

// Preview placeholder primitives (image, sample copy, hint rows) now live in
// '@/components/home/preview-placeholders' so the whole builder shares one system.

// Preview for the canvas. Mirrors PageSections::genericPayload so the editor
// shows the same component (and the active language's content) the site renders.
// When `placeholder` is true, blank fields fall back to sample data.
function draftToRenderBlock(
    draft: SectionDraft,
    lang: string,
    placeholder = false,
    available: { id: number; label: string }[] = [],
): RenderBlock {
    const t = draft.translations[lang] ?? {};
    const group = draft.list_group;
    const rawRows = group ? (draft.lists[group]?.[lang] ?? []) : [];
    let list: BlockListRow[] = rawRows.map((r) => ({
        value: r.value ?? '',
        title: r.title ?? '',
        description: r.description ?? '',
        icon: r.icon ?? '',
        image: r.image_path ?? '',
        url: r.url ?? '',
    }));

    // Resolve the localized scalar fields through the shared placeholder system,
    // so a blank field renders an in-place hint (only for a genuine translation
    // gap) instead of vanishing — applied uniformly to every block, on every page.
    const sample = placeholderContent();
    const fieldSamples: Record<'title' | 'heading' | 'body' | 'cta_label', string> = {
        title: sample.title,
        heading: sample.heading,
        body: sample.body,
        cta_label: sample.cta,
    };
    const resolve = (field: 'title' | 'heading' | 'body' | 'cta_label') =>
        previewField({
            value: t[field],
            field,
            translations: draft.translations,
            isNew: placeholder,
            sample: fieldSamples[field],
        });
    const heading = resolve('heading');
    const body = resolve('body');
    const ctaLabel = resolve('cta_label');
    const title = resolve('title');

    const image = placeholder && !draft.image_path ? placeholderImage() : draft.image_path || null;
    const ctaUrl = draft.cta_url || (placeholder ? sample.url : null);

    // Per-language list rows use the same system: when this language's grid is
    // empty but another language has rows (or the block is brand new), mirror the
    // row count with placeholder tiles so the admin sees exactly where items go.
    if (group && !list.some(hasRowContent)) {
        let reference = 0;
        for (const [code, rows] of Object.entries(draft.lists[group] ?? {})) {
            if (code === lang) continue;
            const filled = (rows ?? []).filter(hasRowContent).length;
            if (filled > reference) reference = filled;
        }
        if (placeholder && reference === 0) reference = 3;
        if (reference > 0) list = sampleRows(reference);
    }

    const base: RenderBlock = {
        id: draft.editorId,
        type: draft.section_type,
        component: draft.component,
        variant:
            draft.component === 'cards'
                ? 'cards'
                : (draft.component as 'banner' | 'announcement'),
        kind: draft.kind,
        zone: draft.zone,
        sort_order: 0,
        is_active: draft.is_active,
        type_label: draft.type_label,
        title,
        spans: defaultSpans(draft.component),
        columns: draft.columns,
        text: { heading, body, cta_label: ctaLabel },
        cta_url: ctaUrl,
        image_path: image,
        tone: draft.tone,
        config: {
            // Forward the block-specific presentation settings (video URL, map
            // embed, countdown date, hero tagline…) the editor stores on
            // `config`; the shared renderers read them straight off it. Without
            // this those blocks stayed blank on the canvas after being filled
            // in. The resolved text/image/CTA/tone win over stale copies.
            ...draft.config,
            heading,
            body,
            image_url: image,
            cta_label: ctaLabel,
            cta_url: ctaUrl,
            tone: draft.tone,
        },
        list,
    };

    if (draft.component === 'hero') {
        return {
            ...base,
            hero: {
                title: heading,
                subtitle: body,
                cta_primary: ctaLabel,
                cta_secondary: String(draft.config.cta_secondary ?? (placeholder ? sample.cta : '')),
                cta_primary_url: ctaUrl ?? '',
                cta_secondary_url: String(draft.config.cta_secondary_url ?? ''),
                tagline: String(
                    draft.config.tagline ??
                        (placeholder
                            ? i18n.t('dashboard.homeSections.visual.fields.tagline')
                            : ''),
                ),
                hero_image: image || '',
            },
        };
    }

    if (draft.component === 'features') {
        return {
            ...base,
            features: list.map((r) => ({
                icon: r.icon,
                title: r.title,
                description: r.description,
            })),
        };
    }

    if (draft.component === 'stats') {
        return { ...base, stats: list.map((r) => ({ value: r.value, label: r.title })) };
    }

    // Curated rails (articles / books / posts / events / programs / jobs) draw
    // their cards from other content. The editor only stores the chosen item IDs
    // (`draft.items`) and can't load the full live records, so render one card
    // per selection using its title (resolved from `availableItems`) over a
    // neutral cover — instead of the bare heading the canvas showed before.
    if (draft.kind === 'curated' && draft.component === 'cards' && draft.items.length > 0) {
        const labelFor = new Map(available.map((a) => [a.id, a.label]));
        const sampleImage = placeholderImage();
        const subtitle = i18n.t(
            `enums.sectionType.${draft.section_type}`,
            draft.type_label,
        );

        return {
            ...base,
            items: draft.items.map((it) => ({
                id: it.id,
                title: labelFor.get(it.id) ?? subtitle,
                subtitle,
                image: sampleImage,
                url: '#',
                dir: 'ltr',
            })) as never,
        };
    }

    // Curated rails with nothing selected yet (new or existing) preview with
    // sample cards so the grid shows what to pin instead of a bare heading.
    if (draft.kind === 'curated' && draft.component === 'cards' && draft.items.length === 0) {
        const sampleImage = placeholderImage();
        const subtitle = i18n.t(
            'dashboard.homeSections.visual.sample.recognizedHighlight',
        );
        const excerpt = i18n.t('dashboard.homeSections.visual.sample.itemPreview');

        return {
            ...base,
            items: [
                i18n.t('dashboard.homeSections.visual.sample.featuredStory'),
                i18n.t('dashboard.homeSections.visual.sample.anotherStory'),
                i18n.t('dashboard.homeSections.visual.sample.oneMoreStory'),
            ].map((cardTitle, i) => ({
                id: i + 1,
                title: cardTitle,
                subtitle,
                excerpt,
                image: sampleImage,
                url: sample.url,
                date: new Date().toISOString(),
                dir: 'ltr',
            })) as never,
        };
    }

    return base;
}

// ---------------------------------------------------------------------------
// Per-block editor sheet
// ---------------------------------------------------------------------------

// Components whose renderer actually paints the block image. Only those get an
// upload field, so a stored image can never end up invisible on the page.
const IMAGE_COMPONENTS = new Set(['hero', 'banner', 'media_text']);

// List groups whose rows render an image (avatars, logo marks, gallery shots).
const IMAGE_LIST_GROUPS = new Set([
    'team',
    'testimonials',
    'partners',
    'gallery',
    'social',
]);

// Which row inputs each list group's renderer actually paints. Anything else is
// hidden so the panel never offers a field that cannot appear on the page.
const ROW_FIELDS: Record<string, string[]> = {
    features: ['title', 'description', 'icon'],
    stats: ['title', 'value'],
    testimonials: ['title', 'value', 'description', 'image'],
    team: ['title', 'value', 'description', 'image'],
    partners: ['title', 'image', 'url'],
    gallery: ['title', 'image'],
    faqs: ['title', 'description'],
    social: ['title', 'image', 'url'],
    contact: ['title', 'value', 'url'],
};

const rowShows = (group: string, field: string): boolean =>
    ROW_FIELDS[group]?.includes(field) ?? true;

// List groups whose rows render a Lucide icon, and the groups that only make
// sense with one (features / icon cards).
const ICON_LIST_GROUPS = new Set(['features']);

// Grid/list blocks whose track count is admin-tunable, mapped to the track
// count their renderer uses when nothing is chosen.
const COLUMN_COMPONENTS: Record<string, number> = {
    list: 3,
    icon_cards: 3,
    stats_cards: 4,
    gallery: 4,
    features: 4,
    stats: 4,
};

// Blocks whose renderer paints the CTA button, so the label/link fields are
// only offered where they actually change the page.
const CTA_COMPONENTS = new Set(['hero', 'banner', 'announcement', 'cta', 'media_text']);
const CTA_LABEL_COMPONENTS = new Set([...CTA_COMPONENTS, 'newsletter']);

// Blocks whose renderer actually paints the stored tone, with its default.
const TONE_COMPONENTS = new Set(['cta']);
const TONES = ['default', 'blue', 'green', 'amber', 'red'] as const;

function RowIcon({ name }: { name: string }) {
    // createElement keeps the resolved component out of render scope, so the
    // hooks lint rule does not read this lookup as defining a component.
    return createElement(resolveIcon(name), {
        className: 'size-4',
        'aria-hidden': true,
    });
}

/** Small icon-only control used by the row headers in the block panel. */
function RowAction({
    label,
    onClick,
    disabled,
    destructive,
    children,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={`rounded p-1 transition hover:bg-muted disabled:opacity-30 ${
                destructive ? 'text-destructive' : 'text-muted-foreground'
            }`}
        >
            {children}
        </button>
    );
}

function BlockEditorSheet({
    draft,
    open,
    onClose,
    editingLang,
    dir,
    candidates,
    onPatch,
    onPatchText,
    onRemove,
    onDuplicate,
    onToggleActive,
}: {
    draft: SectionDraft | null;
    open: boolean;
    onClose: () => void;
    editingLang: string;
    dir: 'ltr' | 'rtl';
    candidates: { id: number; label: string }[];
    onPatch: (id: number, patch: Partial<SectionDraft>) => void;
    onPatchText: (id: number, field: string, value: string) => void;
    onRemove: (id: number) => void;
    onDuplicate: (id: number) => void;
    onToggleActive: (id: number) => void;
}) {
    const { t } = useTranslation();

    if (!draft) {
        return <Sheet open={false} />;
    }

    const text = draft.translations[editingLang] ?? {};
    const isCurated = draft.kind === 'curated';
    const group = draft.list_group;
    const selectedIds = new Set(draft.items.map((i) => i.id));

    const setConfig = (key: string, value: string) =>
        onPatch(draft.editorId, {
            config: { ...draft.config, [key]: value === '' ? undefined : value },
        });

    const toggleItem = (id: number, checked: boolean) => {
        const items = checked
            ? [...draft.items, { id }]
            : draft.items.filter((i) => i.id !== id);
        onPatch(draft.editorId, { items });
    };

    const moveItem = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= draft.items.length) return;
        const items = [...draft.items];
        [items[index], items[target]] = [items[target], items[index]];
        onPatch(draft.editorId, { items });
    };

    const rows = draft.lists[group ?? '']?.[editingLang] ?? [];
    const setRows = (next: ListRow[]) => {
        if (!group) return;
        const byLang = { ...(draft.lists[group] ?? {}), [editingLang]: next };
        onPatch(draft.editorId, { lists: { ...draft.lists, [group]: byLang } });
    };

    const moveRow = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= rows.length) return;
        const next = [...rows];
        [next[index], next[target]] = [next[target], next[index]];
        setRows(next);
    };

    const duplicateRow = (index: number) => {
        const next = [...rows];
        next.splice(index + 1, 0, { ...rows[index] });
        setRows(next);
    };

    // The renderer's designed track count when the admin never picked one.
    const columnDefault = COLUMN_COMPONENTS[draft.component];

    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>{t(draft.label_key, draft.type_label)}</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 p-2">
                    {/* Localized text */}
                    <div className="space-y-3">
                        <Label>
                            {t('dashboard.homeSections.visual.textFor', 'Text · {{lang}}', {
                                lang: editingLang,
                            })}
                        </Label>
                        {isCurated ? (
                            <FieldInput
                                label={t(
                                    'dashboard.homeSections.visual.fields.sectionHeading',
                                    'Section heading',
                                )}
                                value={text.title ?? ''}
                                onChange={(v) => onPatchText(draft.editorId, 'title', v)}
                            />
                        ) : (
                            <>
                                <FieldInput
                                    label={t(
                                        'dashboard.homeSections.visual.fields.heading',
                                        'Heading',
                                    )}
                                    value={text.heading ?? ''}
                                    onChange={(v) => onPatchText(draft.editorId, 'heading', v)}
                                />
                                {draft.component === 'rich_text' ? (
                                    <div className="space-y-1">
                                        <Label>
                                            {t(
                                                'dashboard.homeSections.visual.fields.body',
                                                'Body',
                                            )}
                                        </Label>
                                        <RichTextEditor
                                            key={`rich-${draft.editorId}-${editingLang}`}
                                            name={`body-${draft.editorId}-${editingLang}`}
                                            value={text.body ?? ''}
                                            onChange={(html) =>
                                                onPatchText(draft.editorId, 'body', html)
                                            }
                                            dir={dir}
                                        />
                                    </div>
                                ) : draft.component === 'social_links' ? null : (
                                    <FieldTextarea
                                        label={t(
                                            'dashboard.homeSections.visual.fields.body',
                                            'Body',
                                        )}
                                        value={text.body ?? ''}
                                        onChange={(v) =>
                                            onPatchText(draft.editorId, 'body', v)
                                        }
                                    />
                                )}
                                {CTA_LABEL_COMPONENTS.has(draft.component) ? (
                                    <FieldInput
                                        label={t(
                                            'dashboard.homeSections.visual.fields.buttonLabel',
                                            'Button label',
                                        )}
                                        value={text.cta_label ?? ''}
                                        onChange={(v) =>
                                            onPatchText(draft.editorId, 'cta_label', v)
                                        }
                                    />
                                ) : null}
                                {draft.component === 'hero' ? (
                                    <>
                                        <FieldInput
                                            label={t(
                                                'dashboard.homeSections.visual.fields.tagline',
                                                'Tagline',
                                            )}
                                            value={String(draft.config.tagline ?? '')}
                                            onChange={(v) => setConfig('tagline', v)}
                                        />
                                        <FieldInput
                                            label={t(
                                                'dashboard.homeSections.visual.fields.secondaryButton',
                                                'Secondary button',
                                            )}
                                            value={String(draft.config.cta_secondary ?? '')}
                                            onChange={(v) => setConfig('cta_secondary', v)}
                                        />
                                        <FieldInput
                                            label={t(
                                                'dashboard.homeSections.visual.fields.secondaryLink',
                                                'Secondary link',
                                            )}
                                            value={String(
                                                draft.config.cta_secondary_url ?? '',
                                            )}
                                            onChange={(v) =>
                                                setConfig('cta_secondary_url', v)
                                            }
                                        />
                                    </>
                                ) : null}
                                {draft.component === 'video' ? (
                                    <FieldInput
                                        label={t(
                                            'dashboard.homeSections.visual.fields.videoUrl',
                                            'Video embed URL',
                                        )}
                                        value={String(draft.config.video_url ?? '')}
                                        onChange={(v) => setConfig('video_url', v)}
                                    />
                                ) : null}
                                {draft.component === 'map' || draft.component === 'contact' ? (
                                    <>
                                        <FieldInput
                                            label={t(
                                                'dashboard.homeSections.visual.fields.mapEmbedUrl',
                                                'Map embed URL',
                                            )}
                                            value={String(draft.config.map_embed_url ?? '')}
                                            onChange={(v) =>
                                                setConfig('map_embed_url', v)
                                            }
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <FieldInput
                                                label={t(
                                                    'dashboard.homeSections.visual.fields.latitude',
                                                    'Latitude',
                                                )}
                                                value={String(
                                                    draft.config.map_latitude ?? '',
                                                )}
                                                onChange={(v) =>
                                                    setConfig('map_latitude', v)
                                                }
                                            />
                                            <FieldInput
                                                label={t(
                                                    'dashboard.homeSections.visual.fields.longitude',
                                                    'Longitude',
                                                )}
                                                value={String(
                                                    draft.config.map_longitude ?? '',
                                                )}
                                                onChange={(v) =>
                                                    setConfig('map_longitude', v)
                                                }
                                            />
                                        </div>
                                    </>
                                ) : null}
                                {draft.component === 'countdown' ? (
                                    <FieldInput
                                        label={t(
                                            'dashboard.homeSections.visual.fields.endDate',
                                            'End date (e.g. 2026-12-31T00:00:00)',
                                        )}
                                        value={String(draft.config.end_date ?? '')}
                                        onChange={(v) => setConfig('end_date', v)}
                                    />
                                ) : null}
                                {IMAGE_COMPONENTS.has(draft.component) ? (
                                    <ImageUploadField
                                        label={t(
                                            'dashboard.homeSections.visual.fields.image',
                                            'Image',
                                        )}
                                        name={`section-${draft.editorId}-image`}
                                        value={draft.image_path}
                                        onChange={(v) =>
                                            onPatch(draft.editorId, {
                                                image_path: v,
                                            })
                                        }
                                        hint={t(
                                            'dashboard.homeSections.visual.fields.imageHint',
                                            'Upload a file or paste a path. Shared across all languages.',
                                        )}
                                    />
                                ) : null}
                                {CTA_COMPONENTS.has(draft.component) ? (
                                    <FieldInput
                                        label={t(
                                            'dashboard.homeSections.visual.fields.buttonLink',
                                            'Button link',
                                        )}
                                        value={draft.cta_url}
                                        onChange={(v) =>
                                            onPatch(draft.editorId, { cta_url: v })
                                        }
                                    />
                                ) : null}
                            </>
                        )}
                    </div>

                    {/* Presentation: layout + color. Shared across languages, and
                        only shown for blocks whose renderer actually uses it. */}
                    {columnDefault != null || TONE_COMPONENTS.has(draft.component) ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {columnDefault != null ? (
                                <div className="grid gap-2">
                                    <Label>
                                        {t(
                                            'dashboard.homeSections.visual.fields.columns',
                                            'Columns',
                                        )}
                                    </Label>
                                    <Select
                                        value={String(
                                            draft.columns ?? columnDefault,
                                        )}
                                        onValueChange={(value) =>
                                            onPatch(draft.editorId, {
                                                columns: Number(value),
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4].map((count) => (
                                                <SelectItem
                                                    key={count}
                                                    value={String(count)}
                                                >
                                                    {count}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}
                            {TONE_COMPONENTS.has(draft.component) ? (
                                <div className="grid gap-2">
                                    <Label>
                                        {t(
                                            'dashboard.homeSections.visual.fields.tone',
                                            'Color tone',
                                        )}
                                    </Label>
                                    <Select
                                        value={draft.tone}
                                        onValueChange={(value) =>
                                            onPatch(draft.editorId, {
                                                tone: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TONES.map((tone) => (
                                                <SelectItem
                                                    key={tone}
                                                    value={tone}
                                                >
                                                    {t(
                                                        `dashboard.homeSections.visual.tones.${tone}`,
                                                        tone,
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {/* Curated: limit + item picks */}
                    {isCurated ? (
                        <div className="space-y-3">
                            <FieldInput
                                type="number"
                                label={t(
                                    'dashboard.homeSections.visual.fields.limit',
                                    'Show latest (limit)',
                                )}
                                value={draft.limit == null ? '' : String(draft.limit)}
                                onChange={(v) =>
                                    onPatch(draft.editorId, {
                                        limit: v === '' ? null : Number(v),
                                    })
                                }
                            />
                            <Label className="block">
                                {t(
                                    'dashboard.homeSections.visual.fields.pinnedItems',
                                    'Pinned items (in order)',
                                )}
                            </Label>
                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                                {candidates.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'dashboard.homeSections.visual.list.noCandidates',
                                            'No candidates available.',
                                        )}
                                    </p>
                                ) : (
                                    candidates.map((c) => (
                                        <label
                                            key={c.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={selectedIds.has(c.id)}
                                                onCheckedChange={(checked) =>
                                                    toggleItem(c.id, checked === true)
                                                }
                                            />
                                            <span className="truncate">{c.label}</span>
                                        </label>
                                    ))
                                )}
                            </div>

                            {/* Order matters: the pinned array is rendered as-is. */}
                            {draft.items.length > 0 ? (
                                <div className="space-y-1">
                                    <Label>
                                        {t(
                                            'dashboard.homeSections.visual.fields.pinnedOrder',
                                            'Pinned order',
                                        )}
                                    </Label>
                                    {draft.items.map((item, index) => {
                                        const label =
                                            candidates.find(
                                                (c) => c.id === item.id,
                                            )?.label ?? `#${item.id}`;
                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm"
                                            >
                                                <span className="min-w-0 flex-1 truncate">
                                                    {index + 1}. {label}
                                                </span>
                                                <RowAction
                                                    label={t(
                                                        'dashboard.homeSections.visual.actions.moveUp',
                                                        'Move up',
                                                    )}
                                                    disabled={index === 0}
                                                    onClick={() => moveItem(index, -1)}
                                                >
                                                    <ArrowUp className="size-3.5" />
                                                </RowAction>
                                                <RowAction
                                                    label={t(
                                                        'dashboard.homeSections.visual.actions.moveDown',
                                                        'Move down',
                                                    )}
                                                    disabled={
                                                        index === draft.items.length - 1
                                                    }
                                                    onClick={() => moveItem(index, 1)}
                                                >
                                                    <ArrowDown className="size-3.5" />
                                                </RowAction>
                                                <RowAction
                                                    label={t(
                                                        'dashboard.homeSections.visual.actions.remove',
                                                        'Remove',
                                                    )}
                                                    destructive
                                                    onClick={() =>
                                                        toggleItem(item.id, false)
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </RowAction>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {/* Generic list editor for every list-backed block. */}
                    {group ? (
                        <div className="space-y-2">
                            <Label>
                                {t(
                                    'dashboard.homeSections.visual.list.title',
                                    'List · {{lang}}',
                                    { lang: editingLang },
                                )}
                            </Label>
                            {rows.map((row, index) => {
                                const set = (key: keyof ListRow, value: string) =>
                                    setRows(
                                        rows.map((r, i) =>
                                            i === index ? { ...r, [key]: value } : r,
                                        ),
                                    );
                                return (
                                    <div
                                        key={index}
                                        className="space-y-1 rounded-md border border-border p-2"
                                    >
                                        <div className="flex items-center justify-between gap-2 pb-1">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {t(
                                                    'dashboard.homeSections.visual.list.rowLabel',
                                                    'Row {{n}}',
                                                    { n: index + 1 },
                                                )}
                                            </span>
                                            <div className="flex items-center gap-0.5">
                                                <RowAction
                                                    label={t(
                                                        'dashboard.homeSections.visual.actions.moveUp',
                                                        'Move up',
                                                    )}
                                                    disabled={index === 0}
                                                    onClick={() => moveRow(index, -1)}
                                                >
                                                    <ArrowUp className="size-3.5" />
                                                </RowAction>
                                                <RowAction
                                                    label={t(
                                                        'dashboard.homeSections.visual.actions.moveDown',
                                                        'Move down',
                                                    )}
                                                    disabled={index === rows.length - 1}
                                                    onClick={() => moveRow(index, 1)}
                                                >
                                                    <ArrowDown className="size-3.5" />
                                                </RowAction>
                                                <RowAction
                                                    label={t(
                                                        'dashboard.homeSections.visual.actions.duplicate',
                                                        'Duplicate',
                                                    )}
                                                    onClick={() => duplicateRow(index)}
                                                >
                                                    <Copy className="size-3.5" />
                                                </RowAction>
                                                <RowAction
                                                    label={t(
                                                        'dashboard.homeSections.visual.list.removeRow',
                                                        'Remove row',
                                                    )}
                                                    destructive
                                                    onClick={() =>
                                                        setRows(
                                                            rows.filter(
                                                                (_, i) => i !== index,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </RowAction>
                                            </div>
                                        </div>
                                        <Input
                                            placeholder={
                                                group === 'stats'
                                                    ? t(
                                                          'dashboard.homeSections.visual.list.statLabelPlaceholder',
                                                          'Label (e.g. Students)',
                                                      )
                                                    : t(
                                                          'dashboard.homeSections.visual.list.titlePlaceholder',
                                                          'Title',
                                                      )
                                            }
                                            value={row.title}
                                            onChange={(e) => set('title', e.target.value)}
                                        />
                                        {rowShows(group, 'value') ? (
                                            <Input
                                                placeholder={
                                                    group === 'stats'
                                                        ? t(
                                                              'dashboard.homeSections.visual.list.statValuePlaceholder',
                                                              'Value (e.g. 1,200+)',
                                                          )
                                                        : t(
                                                              'dashboard.homeSections.visual.list.valuePlaceholder',
                                                              'Subtitle / value',
                                                          )
                                                }
                                                value={row.value}
                                                onChange={(e) =>
                                                    set('value', e.target.value)
                                                }
                                            />
                                        ) : null}
                                        {rowShows(group, 'description') ? (
                                            <Textarea
                                                placeholder={t(
                                                    'dashboard.homeSections.visual.list.descriptionPlaceholder',
                                                    'Description',
                                                )}
                                                value={row.description}
                                                onChange={(e) =>
                                                    set('description', e.target.value)
                                                }
                                            />
                                        ) : null}
                                        {ICON_LIST_GROUPS.has(group) ? (
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={row.icon || 'sparkles'}
                                                    onValueChange={(value) =>
                                                        set('icon', value)
                                                    }
                                                >
                                                    <SelectTrigger className="flex-1">
                                                        <SelectValue
                                                            placeholder={t(
                                                                'dashboard.homeSections.visual.list.iconPlaceholder',
                                                                'Icon',
                                                            )}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ICON_OPTIONS.map((option) => (
                                                            <SelectItem
                                                                key={option.value}
                                                                value={option.value}
                                                            >
                                                                {t(
                                                                    `enums.icon.${option.value}`,
                                                                    option.label,
                                                                )}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                                    <RowIcon name={row.icon} />
                                                </span>
                                            </div>
                                        ) : null}
                                        {IMAGE_LIST_GROUPS.has(group) ? (
                                            <ImageUploadField
                                                compact
                                                label={t(
                                                    'dashboard.homeSections.visual.fields.image',
                                                    'Image',
                                                )}
                                                name={`row-${draft.editorId}-${index}-image`}
                                                value={row.image_path}
                                                onChange={(v) => set('image_path', v)}
                                            />
                                        ) : null}
                                        {rowShows(group, 'url') ? (
                                            <Input
                                                placeholder={t(
                                                    'dashboard.homeSections.visual.list.linkPlaceholder',
                                                    'Link URL',
                                                )}
                                                value={row.url}
                                                onChange={(e) =>
                                                    set('url', e.target.value)
                                                }
                                            />
                                        ) : null}
                                    </div>
                                );
                            })}
                            <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                onClick={() => setRows([...rows, emptyListRow()])}
                            >
                                <Plus className="size-4" />
                                {t(
                                    'dashboard.homeSections.visual.list.addRow',
                                    'Add row',
                                )}
                            </Button>
                        </div>
                    ) : null}

                    {/* Block actions, reachable from inside the panel so removing
                        or duplicating a block never depends on the canvas toolbar. */}
                    <div className="space-y-2 border-t border-border pt-4">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => onDuplicate(draft.editorId)}
                        >
                            <Copy className="size-4" />
                            {t(
                                'dashboard.homeSections.visual.actions.duplicateBlock',
                                'Duplicate block',
                            )}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => onToggleActive(draft.editorId)}
                        >
                            {draft.is_active ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                            {draft.is_active
                                ? t(
                                      'dashboard.homeSections.visual.actions.hideBlock',
                                      'Hide block',
                                  )
                                : t(
                                      'dashboard.homeSections.visual.actions.showBlock',
                                      'Show block',
                                  )}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={() => onRemove(draft.editorId)}
                        >
                            <Trash2 className="size-4" />
                            {t(
                                'dashboard.homeSections.visual.actions.removeBlock',
                                'Remove block',
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function FieldInput({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
}) {
    return (
        <div className="space-y-1">
            <Label>{label}</Label>
            <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

function FieldTextarea({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1">
            <Label>{label}</Label>
            <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

/**
 * Inertia page wrapper. The editor is shared by every builder page (home,
 * about); the controller decides which page key and draft feed it receives.
 */
export default function DashboardPageBuilderHome() {
    return <PageBuilderEditor />;
}
