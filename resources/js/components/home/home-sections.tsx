import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
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
    /** i18n fallback heading used when the admin left the title blank. */
    titleKey?: string;
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
    default: 'from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
    blue: 'from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
    green: 'from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
    amber: 'from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
    red: 'from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
};

// Dashed ring shown on hover/focus for any editable text node.
const editableRing =
    'cursor-pointer rounded-md outline-dashed outline-1 outline-transparent transition hover:outline-blue-400/70 focus:outline-blue-500';

function EditableText({
    as: Tag,
    value,
    fallback,
    placeholder,
    className,
    onEdit,
}: {
    as: 'h2' | 'h3' | 'p' | 'span';
    value?: string | null;
    /** Fallback already-resolved text (e.g. the i18n label) shown when blank. */
    fallback?: string;
    placeholder: string;
    className?: string;
    onEdit: () => void;
}) {
    const shown = (value ?? '').trim() || (fallback ?? '').trim();

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
                className="rounded-xl border-2 border-gray-200 bg-transparent px-6 py-2.5 text-sm font-bold text-white"
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
                className="mt-3 inline-block text-sm font-semibold text-blue-600 underline dark:text-blue-300"
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
                className="text-sm font-semibold text-blue-700 underline dark:text-blue-300"
                onEdit={onEdit}
            />
            <button
                type="button"
                onClick={onConfigure}
                title="Edit button link"
                className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-200"
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
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50/60 px-3 py-1.5 text-xs dark:border-blue-800 dark:bg-blue-950/30">
            <span className="font-semibold text-blue-700 dark:text-blue-300">
                {t(`enums.homeSectionType.${section.type}`, section.type_label ?? section.type)}
            </span>
            {section.kind === 'curated' ? (
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    live content
                </span>
            ) : null}
            {section.is_active === false ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    hidden
                </span>
            ) : null}

            <div className="ms-auto flex flex-wrap items-center gap-1.5">
                <button type="button" className={iconBtn} onClick={() => edit.configure(section.id)}>
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
    const { t } = useTranslation();
    const fallbackLabel = section.titleKey ? t(section.titleKey) : '';

    const heading = (
        <>
            {edit ? (
                <EditableText
                    as="h2"
                    value={section.title}
                    fallback={fallbackLabel}
                    placeholder="+ Add heading"
                    className="text-2xl font-bold text-slate-900 dark:text-white"
                    onEdit={() => edit.editText(section.id, 'title')}
                />
            ) : (
                section.title?.trim() || fallbackLabel ? (
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {section.title?.trim() ? section.title : fallbackLabel}
                    </h2>
                ) : null
            )}
        </>
    );

    return (
        <section className="space-y-4">
            {heading}
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
                        className="font-semibold text-blue-600 underline"
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

    // In the editor the admin's chosen image is shown; the public view keeps its
    // existing (placeholder) behaviour untouched.
    const imageSrc = edit
        ? config.image_url ?? null
        : config.image_url
          ? 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'
          : null;

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
                                onEdit={() => edit.editText(section.id, 'cta_label')}
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
                                    className="rounded-xl border-2 border-gray-200 bg-transparent px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-sky-600 hover:border-sky-700 dark:border-sky-400 dark:text-sky-300 dark:hover:bg-sky-500 dark:hover:text-white"
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
                    className="absolute top-3 z-20 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow end-3"
                >
                    🖼 {config.image_url ? 'Change image' : 'Add image'} · link · tone
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
    const accent = 'border-blue-300 bg-blue-50 dark:bg-blue-950/40';

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
                            className="mt-3 inline-block text-sm font-semibold text-blue-700 underline dark:text-blue-300"
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
                        <BannerSection key={section.id} section={section} edit={edit} />
                    ) : section.variant === 'announcement' ? (
                        <AnnouncementSection key={section.id} section={section} edit={edit} />
                    ) : (
                        <CardsSection key={section.id} section={section} edit={edit} />
                    );

                if (!edit) {
                    return body;
                }

                return (
                    <div
                        key={section.id}
                        className={
                            section.is_active === false ? 'opacity-60' : undefined
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
