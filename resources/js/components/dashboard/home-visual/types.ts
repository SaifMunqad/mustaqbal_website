import type { HomeCard } from '@/components/home/home-sections';
import type { HomeFeature, HomeStat } from '@/types';

/**
 * Client-side editing model for the visual home editor. A draft mirrors one
 * `home_sections` row plus its raw, per-language translation rows. `id` is null
 * for freshly added (not-yet-persisted) blocks; `key` is a stable React key.
 */
export type DraftConfig = {
    item_ids: number[];
    image_url: string;
    cta_url: string;
    tone: string;
};

export interface SectionDraft {
    key: string;
    /** Stable numeric id for the canvas/edit handlers: DB id, or a temp id for new blocks. */
    editorId: number;
    id: number | null;
    section_type: string;
    type_label: string;
    label_key: string;
    kind: 'curated' | 'authored';
    variant: 'cards' | 'banner' | 'announcement';
    is_active: boolean;
    limit: number | null;
    config: DraftConfig;
    /** code -> field -> raw value (empty when that language isn't authored yet). */
    translations: Record<string, Record<string, string>>;
    /** Curated preview cards (best-effort live content for the canvas). */
    preview_items: HomeCard[];
}

/** The localized text fields the editor exposes, matching HomeSectionType usage. */
export type TextFieldKey = 'title' | 'heading' | 'body' | 'cta_label';

/** Shape returned by the controller's `visual()` for each section. */
export interface RawVisualSection {
    id: number;
    section_type: string;
    type_label: string;
    label_key: string;
    kind: 'curated' | 'authored';
    variant: 'cards' | 'banner' | 'announcement';
    is_active: boolean;
    limit: number | null;
    config: Partial<DraftConfig> & { item_ids?: number[] };
    translations: Record<string, Record<string, string>>;
    preview_items?: HomeCard[];
}

/** Per-field labels + which fields apply to each kind of section. */
export const FIELD_LABELS: Record<TextFieldKey, string> = {
    title: 'Section heading',
    heading: 'Heading',
    body: 'Body',
    cta_label: 'Button label',
};

export function fieldsForKind(kind: 'curated' | 'authored'): TextFieldKey[] {
    return kind === 'curated' ? ['title'] : ['title', 'heading', 'body', 'cta_label'];
}

/** Map a server draft into the client editing model (seeding a stable key). */
export function draftFromRaw(section: RawVisualSection): SectionDraft {
    return {
        key: `s-${section.id}`,
        editorId: section.id,
        id: section.id,
        section_type: section.section_type,
        type_label: section.type_label,
        label_key: section.label_key,
        kind: section.kind,
        variant: section.variant,
        is_active: section.is_active,
        limit: section.limit,
        config: {
            item_ids: section.config.item_ids ?? [],
            image_url: section.config.image_url ?? '',
            cta_url: section.config.cta_url ?? '',
            tone: section.config.tone ?? 'default',
        },
        translations: section.translations ?? {},
        preview_items: section.preview_items ?? [],
    };
}

/** Frontend card variant for a section type value (mirrors HomeSectionType::variant). */
export function variantForType(type: string): 'cards' | 'banner' | 'announcement' {
    if (type === 'banner') {
        return 'banner';
    }
    if (type === 'announcement') {
        return 'announcement';
    }
    return 'cards';
}

/** Create an unsaved block for a picked type, using a negative temp editor id. */
export function makeEmptyDraft(
    option: { value: string; label: string; kind: 'curated' | 'authored' },
    editorId: number,
): SectionDraft {
    return {
        key: `new-${editorId}`,
        editorId,
        id: null,
        section_type: option.value,
        type_label: option.label,
        label_key: `enums.homeSectionType.${option.value}`,
        kind: option.kind,
        variant: variantForType(option.value),
        is_active: true,
        limit: null,
        config: { item_ids: [], image_url: '', cta_url: '', tone: 'default' },
        translations: {},
        preview_items: [],
    };
}

// ---------------------------------------------------------------------------
// Site Settings blocks edited directly on the home canvas (hero / features /
// stats). These persist against the SiteSetting model, not home_sections.
// ---------------------------------------------------------------------------

export type SiteBlockKind = 'hero' | 'features' | 'stats';

/** One language's slice of the editable Site Settings home fields. */
export interface SiteEntry {
    tagline: string;
    home_title: string;
    home_subtitle: string;
    home_cta_primary: string;
    home_cta_secondary: string;
    home_stats: HomeStat[];
    home_features: HomeFeature[];
}

/** The raw, per-language Site Settings draft (fallback-free) fed by visual(). */
export interface SiteDraft {
    hero_image: string;
    translations: Record<string, SiteEntry>;
}

/** Live-sample payload for the auto programs / jobs preview blocks. */
export interface HomePreview {
    // Loosely typed: these map straight onto the shared ProgramCard / JobCard shapes.
    programs: Record<string, unknown>[];
    jobs: Record<string, unknown>[];
}

export const EMPTY_SITE_ENTRY: SiteEntry = {
    tagline: '',
    home_title: '',
    home_subtitle: '',
    home_cta_primary: '',
    home_cta_secondary: '',
    home_stats: [],
    home_features: [],
};
