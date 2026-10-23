import AppLayout from '@/layouts/app-layout';
import type { FormDataConvertible } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { GripVertical, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { HomeBlock, type RenderBlock } from '@/components/home/page-block';
import type { LanguageOption, SharedData } from '@/types';

// ---------------------------------------------------------------------------
// Types mirroring the controller's fallback-free draft feed.
// ---------------------------------------------------------------------------

interface PaletteOption {
    value: string;
    label: string;
    labelKey: string;
    kind: 'curated' | 'authored';
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
    translations: Record<string, Record<string, string>>;
    items: { id: number; type: string }[];
    lists: Record<string, Record<string, ListRow[]>>;
}

interface BuilderProps {
    sections: RawSection[];
    palette: PaletteOption[];
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
        component: componentFor(option.value),
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
        translations: {},
        items: [],
        lists: {},
    };
}

// Mirror App\Enums\SectionType::component() for the canvas preview.
function componentFor(type: string): string {
    if (type === 'hero') return 'hero';
    if (type === 'features') return 'features';
    if (type === 'stats') return 'stats';
    if (type === 'programs') return 'programs';
    if (type === 'jobs') return 'jobs';
    if (type === 'banner') return 'banner';
    if (type === 'announcement') return 'announcement';
    return 'cards';
}

const SPAN_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

function spanBucket(device: PreviewDevice): 'sm' | 'md' | 'lg' {
    return device === 'mobile' ? 'sm' : device === 'tablet' ? 'md' : 'lg';
}

function spanFor(draft: SectionDraft, device: PreviewDevice): number {
    const bucket = spanBucket(device);
    const value =
        bucket === 'sm' ? draft.span_sm : bucket === 'md' ? draft.span_md : draft.span_lg;
    return value ?? 12;
}

export default function DashboardPageBuilderHome() {
    const { sections, palette, availableItems, defaultLanguage } =
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
    const [editingEditorId, setEditingEditorId] = useState<number | null>(null);

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

    const toggleActive = (editorId: number) => {
        const draft = drafts.find((d) => d.editorId === editorId);
        if (draft) patchDraft(editorId, { is_active: !draft.is_active });
    };

    const onDragStart = (event: DragStartEvent) =>
        setActiveId(String(event.active.id));

    const onDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
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
            '/dashboard/pages/home/save',
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
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Page builder', href: '/dashboard/pages/home' },
            ]}
        >
            <Head title="Home page builder" />

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
                            {(['desktop', 'tablet', 'mobile'] as PreviewDevice[]).map((d) => (
                                <Button
                                    key={d}
                                    size="sm"
                                    variant={device === d ? 'default' : 'ghost'}
                                    type="button"
                                    onClick={() => setDevice(d)}
                                >
                                    {d}
                                </Button>
                            ))}
                        </div>

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

                <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                    {/* Palette: drag a chip onto the canvas. */}
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                            {t('dashboard.homeSections.visual.blocksTitle', 'Blocks')}
                        </h2>
                        <div className="flex flex-wrap gap-2 lg:flex-col">
                            {palette.map((option) => {
                                const capped =
                                    option.maxInstances !== null &&
                                    (counts[option.value] ?? 0) >= option.maxInstances;
                                return (
                                    <PaletteChip
                                        key={option.value}
                                        option={option}
                                        disabled={capped}
                                    />
                                );
                            })}
                        </div>
                    </aside>

                    {/* Canvas: single ordered, responsive, non-overlapping flow. */}
                    <div
                        dir={dir}
                        className="mx-auto w-full transition-all"
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
                            editingId={editingEditorId}
                            onEdit={setEditingEditorId}
                            onRemove={removeDraft}
                            onToggleActive={toggleActive}
                        />
                    </div>
                </div>

                <DragOverlay>
                    {activeId && activeId.startsWith('palette:') ? (
                        <div className="rounded-lg border border-dashed border-blue-400 bg-background px-3 py-2 text-sm shadow-lg">
                            {activeId.replace('palette:', '')}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <BlockEditorSheet
                draft={editingDraft}
                open={editingEditorId != null}
                onClose={() => setEditingEditorId(null)}
                editingLang={editingLang}
                candidates={
                    editingDraft ? (availableItems[editingDraft.section_type] ?? []) : []
                }
                onPatch={patchDraft}
                onPatchText={setText}
            />
        </AppLayout>
    );
}

// ---------------------------------------------------------------------------
// Palette chip (draggable)
// ---------------------------------------------------------------------------

function PaletteChip({ option, disabled }: { option: PaletteOption; disabled: boolean }) {
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
            className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start text-sm transition ${
                disabled
                    ? 'cursor-not-allowed border-border/50 text-muted-foreground/50'
                    : 'cursor-grab border-border bg-card hover:border-blue-400 hover:shadow-sm'
            } ${isDragging ? 'opacity-40' : ''}`}
        >
            <span className="font-medium">{label}</span>
            <span className="text-muted-foreground">{option.kind}</span>
        </button>
    );
}

// ---------------------------------------------------------------------------
// Sortable canvas
// ---------------------------------------------------------------------------

function SortableBlocks({
    drafts,
    device,
    editingId,
    onEdit,
    onRemove,
    onToggleActive,
}: {
    drafts: SectionDraft[];
    device: PreviewDevice;
    editingId: number | null;
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
                            isEditing={editingId === draft.editorId}
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
    isEditing,
    onEdit,
    onRemove,
    onToggleActive,
}: {
    draft: SectionDraft;
    device: PreviewDevice;
    isEditing: boolean;
    onEdit: (id: number) => void;
    onRemove: (id: number) => void;
    onToggleActive: (id: number) => void;
}) {
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
            className={`group relative rounded-xl outline outline-2 outline-transparent transition ${
                isDragging ? 'z-10 opacity-60' : ''
            } ${isEditing ? 'outline-blue-500' : 'hover:outline-blue-300'}`}
        >
            {/* Toolbar: drag handle lives only here so links inside stay clickable. */}
            <div className="absolute -top-3 z-10 flex items-center gap-1 rounded-lg border border-border bg-background px-1 py-0.5 shadow-sm opacity-0 transition group-hover:opacity-100 ltr:left-2 rtl:right-2">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted"
                    aria-label="Drag to reorder"
                >
                    <GripVertical className="size-4" />
                </button>
                <span className="max-w-[160px] truncate text-xs font-medium">
                    {draft.type_label}
                </span>
                <button
                    type="button"
                    onClick={() => onToggleActive(draft.editorId)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                    title={draft.is_active ? 'Visible' : 'Hidden'}
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
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => onRemove(draft.editorId)}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    title="Remove"
                >
                    <Trash2 className="size-4" />
                </button>
            </div>

            <div className={draft.is_active ? '' : 'opacity-40'}>
                {draft.id === null && draft.items.length === 0 && !hasContent(draft) ? (
                    <EmptyBlock draft={draft} />
                ) : (
                    <HomeBlock block={draftToRenderBlock(draft)} rtl={false} />
                )}
            </div>
        </div>
    );
}

function hasContent(draft: SectionDraft): boolean {
    const text = draft.translations.en ?? {};
    return Boolean(text.title || text.heading || text.body || draft.image_path);
}

function EmptyBlock({ draft }: { draft: SectionDraft }) {
    return (
        <div className="flex min-h-[80px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
            {draft.type_label}
        </div>
    );
}

// A minimal preview block; the canvas reuses the same component map as the site.
function draftToRenderBlock(draft: SectionDraft): RenderBlock {
    const text = draft.translations.en ?? {};
    return {
        id: draft.editorId,
        type: draft.section_type,
        component: draft.component,
        variant: draft.component === 'cards' ? 'cards' : (draft.component as 'banner' | 'announcement'),
        kind: draft.kind,
        zone: draft.zone,
        sort_order: 0,
        is_active: draft.is_active,
        type_label: draft.type_label,
        title: text.title ?? '',
        title_key: draft.label_key,
        spans: {
            lg: draft.span_lg ?? 12,
            md: draft.span_md ?? 12,
            sm: draft.span_sm ?? 12,
        },
        items: draft.items.length ? [] : undefined,
        config: {
            heading: text.heading ?? '',
            body: text.body ?? '',
            image_url: draft.image_path || null,
            cta_label: text.cta_label ?? '',
            cta_url: draft.cta_url || null,
            tone: draft.tone,
        },
    };
}

// ---------------------------------------------------------------------------
// Per-block editor sheet
// ---------------------------------------------------------------------------

function BlockEditorSheet({
    draft,
    open,
    onClose,
    editingLang,
    candidates,
    onPatch,
    onPatchText,
}: {
    draft: SectionDraft | null;
    open: boolean;
    onClose: () => void;
    editingLang: string;
    candidates: { id: number; label: string }[];
    onPatch: (id: number, patch: Partial<SectionDraft>) => void;
    onPatchText: (id: number, field: string, value: string) => void;
}) {
    if (!draft) {
        return <Sheet open={false} />;
    }

    const text = draft.translations[editingLang] ?? {};
    const isCurated = draft.kind === 'curated';
    const group = draft.component === 'features' ? 'features' : draft.component === 'stats' ? 'stats' : null;
    const selectedIds = new Set(draft.items.map((i) => i.id));

    const setSpan = (key: 'span_lg' | 'span_md' | 'span_sm', value: string) =>
        onPatch(draft.editorId, { [key]: Number(value) } as Partial<SectionDraft>);

    const toggleItem = (id: number, checked: boolean) => {
        const items = checked
            ? [...draft.items, { id }]
            : draft.items.filter((i) => i.id !== id);
        onPatch(draft.editorId, { items });
    };

    const rows = draft.lists[group ?? '']?.[editingLang] ?? [];
    const setRows = (next: ListRow[]) => {
        if (!group) return;
        const byLang = { ...(draft.lists[group] ?? {}), [editingLang]: next };
        onPatch(draft.editorId, { lists: { ...draft.lists, [group]: byLang } });
    };

    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>{draft.type_label}</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 py-4">
                    {/* Responsive spans */}
                    <div>
                        <Label className="mb-2 block">Responsive width (1-12)</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['span_sm', 'span_md', 'span_lg'] as const).map((key) => (
                                <div key={key} className="space-y-1">
                                    <span className="text-xs text-muted-foreground">
                                        {key === 'span_sm' ? 'Mobile' : key === 'span_md' ? 'Tablet' : 'Desktop'}
                                    </span>
                                    <Select
                                        value={String(draft[key] ?? 12)}
                                        onValueChange={(v) => setSpan(key, v)}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SPAN_OPTIONS.map((n) => (
                                                <SelectItem key={n} value={String(n)}>
                                                    {n}/12
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Localized text */}
                    <div className="space-y-3">
                        <Label>Text · {editingLang}</Label>
                        {isCurated ? (
                            <FieldInput
                                label="Section heading"
                                value={text.title ?? ''}
                                onChange={(v) => onPatchText(draft.editorId, 'title', v)}
                            />
                        ) : (
                            <>
                                <FieldInput
                                    label="Heading"
                                    value={text.heading ?? ''}
                                    onChange={(v) => onPatchText(draft.editorId, 'heading', v)}
                                />
                                <FieldTextarea
                                    label="Body"
                                    value={text.body ?? ''}
                                    onChange={(v) => onPatchText(draft.editorId, 'body', v)}
                                />
                                <FieldInput
                                    label="Button label"
                                    value={text.cta_label ?? ''}
                                    onChange={(v) => onPatchText(draft.editorId, 'cta_label', v)}
                                />
                                {draft.component === 'hero' ? (
                                    <>
                                        <FieldInput
                                            label="Tagline"
                                            value={String(draft.config.tagline ?? '')}
                                            onChange={(v) =>
                                                onPatch(draft.editorId, {
                                                    config: { ...draft.config, tagline: v },
                                                })
                                            }
                                        />
                                        <FieldInput
                                            label="Secondary button"
                                            value={String(draft.config.cta_secondary ?? '')}
                                            onChange={(v) =>
                                                onPatch(draft.editorId, {
                                                    config: { ...draft.config, cta_secondary: v },
                                                })
                                            }
                                        />
                                    </>
                                ) : null}
                                <FieldInput
                                    label="Image path"
                                    value={draft.image_path}
                                    onChange={(v) => onPatch(draft.editorId, { image_path: v })}
                                />
                                <FieldInput
                                    label="Button link"
                                    value={draft.cta_url}
                                    onChange={(v) => onPatch(draft.editorId, { cta_url: v })}
                                />
                            </>
                        )}
                    </div>

                    {/* Curated: limit + item picks */}
                    {isCurated ? (
                        <div className="space-y-3">
                            <FieldInput
                                type="number"
                                label="Show latest (limit)"
                                value={draft.limit == null ? '' : String(draft.limit)}
                                onChange={(v) =>
                                    onPatch(draft.editorId, {
                                        limit: v === '' ? null : Number(v),
                                    })
                                }
                            />
                            <Label className="block">Pinned items (in order)</Label>
                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                                {candidates.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        No candidates available.
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
                        </div>
                    ) : null}

                    {/* Features / stats list editor */}
                    {group ? (
                        <div className="space-y-2">
                            <Label>List · {editingLang}</Label>
                            {rows.map((row, index) => (
                                <div
                                    key={index}
                                    className="space-y-1 rounded-md border border-border p-2"
                                >
                                    {group === 'stats' ? (
                                        <>
                                            <Input
                                                placeholder="Value"
                                                value={row.value}
                                                onChange={(e) =>
                                                    setRows(
                                                        rows.map((r, i) =>
                                                            i === index
                                                                ? { ...r, value: e.target.value }
                                                                : r,
                                                        ),
                                                    )
                                                }
                                            />
                                            <Input
                                                placeholder="Label"
                                                value={row.title}
                                                onChange={(e) =>
                                                    setRows(
                                                        rows.map((r, i) =>
                                                            i === index
                                                                ? { ...r, title: e.target.value }
                                                                : r,
                                                        ),
                                                    )
                                                }
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Input
                                                placeholder="Icon key"
                                                value={row.icon}
                                                onChange={(e) =>
                                                    setRows(
                                                        rows.map((r, i) =>
                                                            i === index
                                                                ? { ...r, icon: e.target.value }
                                                                : r,
                                                        ),
                                                    )
                                                }
                                            />
                                            <Input
                                                placeholder="Title"
                                                value={row.title}
                                                onChange={(e) =>
                                                    setRows(
                                                        rows.map((r, i) =>
                                                            i === index
                                                                ? { ...r, title: e.target.value }
                                                                : r,
                                                        ),
                                                    )
                                                }
                                            />
                                            <Textarea
                                                placeholder="Description"
                                                value={row.description}
                                                onChange={(e) =>
                                                    setRows(
                                                        rows.map((r, i) =>
                                                            i === index
                                                                ? { ...r, description: e.target.value }
                                                                : r,
                                                        ),
                                                    )
                                                }
                                            />
                                        </>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        type="button"
                                        className="text-destructive"
                                        onClick={() => setRows(rows.filter((_, i) => i !== index))}
                                    >
                                        Remove row
                                    </Button>
                                </div>
                            ))}
                            <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                onClick={() => setRows([...rows, emptyListRow()])}
                            >
                                <Plus className="size-4" /> Add row
                            </Button>
                        </div>
                    ) : null}
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
