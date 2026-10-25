/**
 * Renders the admin-curated home page sections (cards, banner, announcement).
 *
 * This is the public renderer for `HomeSection` rows: it owns the card grid,
 * masonry layout and per-section config. When `HomeSectionEditApi` callbacks are
 * supplied it additionally exposes the visual editor's in-place affordances —
 * omitting them makes the output byte-for-byte identical to the visitor view.
 */
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import HomeCardItem, { shapeForIndex, type HomeCard } from './home-card-item';

export type { HomeCard };

export interface HomeSectionConfig {
    heading?: string | null;
    body?: string | null;
    image_url?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    tone?: string;
}

export interface HomeSection {
    id: number;
    type: string;
    variant: 'cards' | 'banner' | 'announcement';
    title?: string | null;
    items?: HomeCard[];
    config?: HomeSectionConfig;
    /** Editor-only metadata, present when rendering inside the visual editor. */
    type_label?: string;
    kind?: 'curated' | 'authored';
    is_active?: boolean;
}

/** Text fields the admin can edit in place, each mapped to a translation key. */
export type HomeEditableField = 'title' | 'heading' | 'body' | 'cta_label';

/**
 * Callbacks the visual editor passes down so rendered blocks expose in-place
 * affordances. When `edit` is omitted the component renders byte-for-byte as the
 * public home page, so visitor output is never affected.
 */
export interface HomeSectionEditApi {
    editText: (id: number, field: HomeEditableField) => void;
    configure: (id: number) => void;
    toggleActive: (id: number) => void;
    move: (id: number, direction: -1 | 1) => void;
    remove: (id: number) => void;
    isFirst: (id: number) => boolean;
    isLast: (id: number) => boolean;
}

const toneStyles: Record<string, string> = {
    default:
        'from-brand-soft-strong to-brand dark:from-brand-deep dark:to-brand-deep',
    blue: 'from-brand-soft-strong to-brand dark:from-brand-deep dark:to-brand-deep',
    green: 'from-brand-soft-strong to-brand dark:from-brand-deep dark:to-brand-deep',
    amber: 'from-brand-soft-strong to-brand dark:from-brand-deep dark:to-brand-deep',
    red: 'from-brand-soft-strong to-brand dark:from-brand-deep dark:to-brand-deep',
};

// Dashed ring shown on hover/focus for any editable text node.
const editableRing =
    'cursor-pointer rounded-md outline-dashed outline-1 outline-transparent transition hover:outline-brand/70 focus:outline-brand';

// One shared look for the banner CTA so the visual editor's preview button is
// pixel-identical to the button visitors actually see on the live home page.
//
// The banner paints a neutral black scrim over its image/tone, so this button
// uses a fixed reverse palette. Brand tokens (brand-ink on a dark scrim) are
// unreadable for most colors — the border would show while the label vanished.
const bannerCtaClasses =
    'rounded-xl border-2 border-white/70 bg-transparent px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:border-white hover:bg-white/10';

function EditableText({
    as: Tag,
    value,
    placeholder,
    className,
    onEdit,
}: {
    as: 'h2' | 'h3' | 'p' | 'span';
    value?: string | null;
    placeholder: string;
    className?: string;
    onEdit: () => void;
}) {
    // Authored text only: visitor-facing copy is never resolved through i18n,
    // so an untranslated string can never leak a translation key into content.
    const shown = (value ?? '').trim();

    return (
        <Tag
            role="button"
            tabIndex={0}
            onClick={onEdit}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onEdit();
                }
            }}
            title={placeholder}
            className={cn(className, editableRing)}
        >
            {shown ? (
                shown
            ) : (
                <span className="italic opacity-60">{placeholder}</span>
            )}
        </Tag>
    );
}

function EditableBannerButton({
    config,
    onEdit,
    onConfigure,
}: {
    config: HomeSectionConfig;
    onEdit: () => void;
    onConfigure: () => void;
}) {
    if (!config.cta_url) {
        return (
            <button
                type="button"
                onClick={onConfigure}
                className="mt-6 inline-block rounded-xl border border-dashed border-white/60 px-6 py-2.5 text-sm font-bold text-white/80"
            >
                + Add button link
            </button>
        );
    }

    return (
        <div className="mt-6 flex items-center gap-2">
            <EditableText
                as="span"
                value={config.cta_label}
                placeholder="Button label"
                className={bannerCtaClasses}
                onEdit={onEdit}
            />
            <button
                type="button"
                onClick={onConfigure}
                title="Edit button link"
                className="rounded-full bg-white/20 px-2 py-1 text-xs text-white"
            >
                ↗
            </button>
        </div>
    );
}

function AnnouncementBannerButton({
    config,
    onEdit,
    onConfigure,
}: {
    config: HomeSectionConfig;
    onEdit: () => void;
    onConfigure: () => void;
}) {
    if (!config.cta_url) {
        return (
            <button
                type="button"
                onClick={onConfigure}
                className="mt-3 inline-block text-sm font-semibold text-brand-ink underline"
            >
                + Add button link
            </button>
        );
    }

    return (
        <div className="mt-3 flex items-center gap-2">
            <EditableText
                as="span"
                value={config.cta_label}
                placeholder="Button label"
                className="text-sm font-semibold text-brand-ink underline"
                onEdit={onEdit}
            />
            <button
                type="button"
                onClick={onConfigure}
                title="Edit button link"
                className="rounded-full bg-brand-soft-strong px-2 py-0.5 text-xs text-brand-ink dark:bg-brand-deep"
            >
                ↗
            </button>
        </div>
    );
}

function SectionToolbar({
    section,
    edit,
}: {
    section: HomeSection;
    edit: HomeSectionEditApi;
}) {
    const { t } = useTranslation();

    const iconBtn =
        'rounded px-2 py-0.5 text-xs font-medium border border-border bg-card hover:bg-accent disabled:opacity-40';

    return (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-brand-border bg-brand-soft/60 px-3 py-1.5 text-xs dark:bg-brand-deep/30">
            <span className="font-semibold text-brand-ink">
                {t(
                    `enums.sectionType.${section.type}`,
                    section.type_label ?? section.type,
                )}
            </span>
            {section.kind === 'curated' ? (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                    live content
                </span>
            ) : null}
            {section.is_active === false ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    hidden
                </span>
            ) : null}

            <div className="ms-auto flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    className={iconBtn}
                    onClick={() => edit.configure(section.id)}
                >
                    ⚙ Settings
                </button>
                <button
                    type="button"
                    className={iconBtn}
                    onClick={() => edit.toggleActive(section.id)}
                >
                    {section.is_active === false ? 'Show' : 'Hide'}
                </button>
                <button
                    type="button"
                    className={iconBtn}
                    disabled={edit.isFirst(section.id)}
                    onClick={() => edit.move(section.id, -1)}
                    aria-label="Move up"
                >
                    ↑
                </button>
                <button
                    type="button"
                    className={iconBtn}
                    disabled={edit.isLast(section.id)}
                    onClick={() => edit.move(section.id, 1)}
                    aria-label="Move down"
                >
                    ↓
                </button>
                <button
                    type="button"
                    className={cn(iconBtn, 'text-red-600 dark:text-red-400')}
                    onClick={() => edit.remove(section.id)}
                >
                    Remove
                </button>
            </div>
        </div>
    );
}

function CardsSection({
    section,
    edit,
}: {
    section: HomeSection;
    edit?: HomeSectionEditApi;
}) {
    const title = section.title?.trim();

    return (
        <section className="space-y-4">
            {edit ? (
                <EditableText
                    as="h2"
                    value={section.title}
                    placeholder="+ Add heading"
                    className="text-2xl font-bold text-slate-900 dark:text-white"
                    onEdit={() => edit.editText(section.id, 'title')}
                />
            ) : title ? (
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {title}
                </h2>
            ) : null}
            <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
                {(section.items ?? []).map((card, index) => (
                    <HomeCardItem
                        key={card.id}
                        card={card}
                        shapeClass={shapeForIndex(index)}
                    />
                ))}
            </div>
            {edit && (section.items ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    No items yet — pick content in{' '}
                    <button
                        type="button"
                        className="font-semibold text-brand-ink underline"
                        onClick={() => edit.configure(section.id)}
                    >
                        Settings
                    </button>
                    .
                </div>
            ) : null}
        </section>
    );
}

function BannerSection({
    section,
    edit,
}: {
    section: HomeSection;
    edit?: HomeSectionEditApi;
}) {
    const config = section.config ?? {};
    const tone = toneStyles[config.tone ?? 'default'] ?? toneStyles.default;

    // Both the editor and the live page show the admin's chosen image; there is
    // no hard-coded placeholder any more, so a saved banner image always shows.
    const imageSrc = config.image_url ?? null;

    return (
        <section
            className={`relative min-h-[380px] overflow-hidden rounded-3xl bg-gradient-to-r ${tone} p-6 shadow-md md:min-h-[460px] md:p-10`}
        >
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={config.heading ?? ''}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : null}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 dark:from-black/90 dark:via-black/50" />

            <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-end">
                {edit ? (
                    <>
                        <EditableText
                            as="h2"
                            value={config.heading}
                            placeholder="+ Add heading"
                            className="text-2xl font-bold tracking-tight text-white drop-shadow-sm md:text-4xl"
                            onEdit={() => edit.editText(section.id, 'heading')}
                        />
                        <EditableText
                            as="p"
                            value={config.body}
                            placeholder="+ Add body text"
                            className="mt-3 max-w-2xl text-base text-slate-200 md:text-lg"
                            onEdit={() => edit.editText(section.id, 'body')}
                        />
                        <div className="mt-6 flex items-center gap-3">
                            <EditableBannerButton
                                config={config}
                                onEdit={() =>
                                    edit.editText(section.id, 'cta_label')
                                }
                                onConfigure={() => edit.configure(section.id)}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        {config.heading ? (
                            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm md:text-4xl">
                                {config.heading}
                            </h2>
                        ) : null}
                        {config.body ? (
                            <p className="mt-3 max-w-2xl text-base text-slate-200 md:text-lg">
                                {config.body}
                            </p>
                        ) : null}
                        {config.cta_label && config.cta_url ? (
                            <div className="mt-6">
                                <Link
                                    href={config.cta_url}
                                    className={bannerCtaClasses}
                                >
                                    {config.cta_label}
                                </Link>
                            </div>
                        ) : null}
                    </>
                )}
            </div>

            {edit ? (
                <button
                    type="button"
                    onClick={() => edit.configure(section.id)}
                    className="absolute end-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow"
                >
                    🖼 {config.image_url ? 'Change image' : 'Add image'} · link
                    · tone
                </button>
            ) : null}
        </section>
    );
}

function AnnouncementSection({
    section,
    edit,
}: {
    section: HomeSection;
    edit?: HomeSectionEditApi;
}) {
    const config = section.config ?? {};

    // Customer-facing announcements use a single blue accent regardless of the
    // stored tone, matching the site's simplified blue palette.
    const accent = 'border-brand-border bg-brand-soft dark:bg-brand-deep/40';

    return (
        <section className={`rounded-2xl border p-5 ${accent}`}>
            {edit ? (
                <>
                    <EditableText
                        as="h3"
                        value={config.heading}
                        placeholder="+ Add heading"
                        className="text-lg font-bold text-slate-900 dark:text-white"
                        onEdit={() => edit.editText(section.id, 'heading')}
                    />
                    <EditableText
                        as="p"
                        value={config.body}
                        placeholder="+ Add body text"
                        className="mt-2 text-sm text-slate-700 dark:text-slate-200"
                        onEdit={() => edit.editText(section.id, 'body')}
                    />
                    <AnnouncementBannerButton
                        config={config}
                        onEdit={() => edit.editText(section.id, 'cta_label')}
                        onConfigure={() => edit.configure(section.id)}
                    />
                </>
            ) : (
                <>
                    {config.heading ? (
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {config.heading}
                        </h3>
                    ) : null}
                    {config.body ? (
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                            {config.body}
                        </p>
                    ) : null}
                    {config.cta_label && config.cta_url ? (
                        <Link
                            href={config.cta_url}
                            className="mt-3 inline-block text-sm font-semibold text-brand-ink underline"
                        >
                            {config.cta_label}
                        </Link>
                    ) : null}
                </>
            )}
        </section>
    );
}

export default function HomeSections({
    sections,
    edit,
}: {
    sections: HomeSection[];
    edit?: HomeSectionEditApi;
}) {
    return (
        <div className="space-y-8">
            {sections.map((section) => {
                const body =
                    section.variant === 'banner' ? (
                        <BannerSection
                            key={section.id}
                            section={section}
                            edit={edit}
                        />
                    ) : section.variant === 'announcement' ? (
                        <AnnouncementSection
                            key={section.id}
                            section={section}
                            edit={edit}
                        />
                    ) : (
                        <CardsSection
                            key={section.id}
                            section={section}
                            edit={edit}
                        />
                    );

                if (!edit) {
                    return body;
                }

                return (
                    <div
                        key={section.id}
                        className={
                            section.is_active === false
                                ? 'opacity-60'
                                : undefined
                        }
                    >
                        <SectionToolbar section={section} edit={edit} />
                        {body}
                    </div>
                );
            })}
        </div>
    );
}
