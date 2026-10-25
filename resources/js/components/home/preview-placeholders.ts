/**
 * Shared preview-placeholder system for the visual page builder.
 *
 * The home / about / contact builders all normalize their blocks through a single
 * function (`draftToRenderBlock`), so every rule lives here ONCE and is applied to
 * every section and every field automatically — no per-section or per-page code.
 *
 * A blank field is shown as a localized in-place hint only when it is a genuine
 * gap for the language being previewed: empty here, but filled in at least one
 * other language (or the block is brand new). Optional fields left blank in every
 * language stay blank, so the canvas is never littered with noise. These hints are
 * a preview concern only — the public page is rendered server-side and never sees
 * them, and they are never written back into the draft (the edit inputs stay empty).
 */
import i18n from '@/i18n';
import type { BlockListRow } from '@/components/home/page-block';

/** True when a value carries real, trimmed content. */
export const hasText = (value?: string | null): boolean => Boolean(value && value.trim());

/** Neutral SVG cover used wherever a preview image is missing. */
export function placeholderImage(): string {
    return (
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
            '<rect width="100%" height="100%" fill="#e2e8f0"/>' +
            '<text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#94a3b8"' +
            ' text-anchor="middle" dominant-baseline="middle">' +
            i18n.t('dashboard.homeSections.visual.sample.image') +
            '</text></svg>',
        )
    );
}

/** Sample copy for brand-new blocks: real components rendered with placeholder text. */
export function placeholderContent() {
    return {
        title: i18n.t('dashboard.homeSections.visual.sample.title'),
        heading: i18n.t('dashboard.homeSections.visual.sample.heading'),
        body: i18n.t('dashboard.homeSections.visual.sample.body'),
        cta: i18n.t('dashboard.homeSections.visual.sample.cta'),
        url: '#',
    };
}

/**
 * Localized in-place hint for a blank text field. Field-name driven, so a new
 * translatable field is covered without touching any renderer.
 */
export function placeholderHint(field: string): string {
    switch (field) {
        case 'heading':
            return i18n.t('dashboard.homeSections.visual.placeholders.heading', '+ Add heading');
        case 'body':
            return i18n.t('dashboard.homeSections.visual.placeholders.body', '+ Add body text');
        case 'cta_label':
            return i18n.t(
                'dashboard.homeSections.visual.placeholders.buttonLabel',
                '+ Button label',
            );
        case 'title':
            return i18n.t(
                'dashboard.homeSections.visual.placeholders.sectionTitle',
                '+ Section title',
            );
        default:
            return i18n.t('dashboard.homeSections.visual.placeholders.field', '+ Add');
    }
}

/**
 * Resolve one localized scalar field for the canvas. Returns the real copy when
 * present; a sample for a brand-new block; an in-place hint when the same field
 * is filled in another language (a translation gap); otherwise an empty string so
 * optional copy never becomes noise.
 */
export function previewField(params: {
    value?: string;
    field: string;
    translations: Record<string, Record<string, string>>;
    isNew: boolean;
    sample: string;
}): string {
    const { value, field, translations, isNew, sample } = params;
    if (hasText(value)) return value as string;
    if (isNew) return sample;
    const expectedElsewhere = Object.values(translations).some((row) => hasText(row[field]));
    return expectedElsewhere ? placeholderHint(field) : '';
}

/**
 * Placeholder list rows for a block whose per-language grid is empty. The count
 * mirrors the busiest other language so the admin sees the right number of tiles;
 * a brand-new block falls back to three. Beyond the three named samples the label
 * degrades to a generic "Item N".
 */
export function sampleRows(count = 3): BlockListRow[] {
    const image = placeholderImage();
    const value = i18n.t('dashboard.homeSections.visual.sample.value');
    const description = i18n.t('dashboard.homeSections.visual.sample.body');
    const named = [
        i18n.t('dashboard.homeSections.visual.sample.firstItem'),
        i18n.t('dashboard.homeSections.visual.sample.secondItem'),
        i18n.t('dashboard.homeSections.visual.sample.thirdItem'),
    ];

    return Array.from({ length: Math.max(1, count) }, (_, i) => ({
        value,
        title:
            named[i] ??
            i18n.t('dashboard.homeSections.visual.sample.itemN', { n: i + 1 }),
        description,
        icon: 'star',
        image,
        url: '#',
    }));
}

/** True when a list row carries any real content across its fields. */
export const hasRowContent = (row: {
    title?: string | null;
    value?: string | null;
    description?: string | null;
    image?: string | null;
    image_path?: string | null;
    url?: string | null;
}): boolean =>
    [row.title, row.value, row.description, row.image, row.image_path, row.url].some(hasText);
