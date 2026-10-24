/**
 * Recognitions/honours showcase used on the public showcase page.
 *
 * Groups posts by category, lets the visitor switch between those groups, and
 * lays each one out as a podium: the first entry is featured, the next two run
 * beside it and the rest follow in a grid. The whole section staggers in through
 * the shared `Reveal` primitive.
 */
import Reveal from '@/components/ui/reveal';
import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface ShowcasePost {
    id: number;
    title: string;
    excerpt?: string | null;
    images?: string[] | null;
    honoree?: string | null;
    created_at?: string | null;
}

export interface ShowcaseGroup {
    type: string;
    label: string;
    /** i18n key from the backend; the group heading is translated from it. */
    labelKey?: string;
    posts: ShowcasePost[];
}

/**
 * Collapse the granular post types (student of the week/month, teacher, …) into
 * the three showcase categories we surface as tabs / headings. Derived from the
 * type value so it stays correct even if the backend adds a new variant.
 */
function categoryKey(type: string): 'students' | 'teachers' | 'employees' {
    if (type.startsWith('student')) return 'students';
    if (type.startsWith('teacher')) return 'teachers';
    return 'employees';
}

/**
 * Podium rank derived from a post's position within its category. Rank 0 is the
 * champion (gold, full-width), 1 and 2 the runners-up (silver, sharing a row),
 * everything else a standard card. The backend already orders posts featured-
 * first, so array position is the ranking.
 */
type CardRank = 0 | 1 | 2 | 3;

function rankOf(index: number): CardRank {
    if (index === 0) return 0;
    if (index === 1) return 1;
    if (index === 2) return 2;
    return 3;
}

interface RankTheme {
    card: string;
    ribbon: string;
    ring: string;
    fallback: string;
    role: string;
}

// Per-rank colors. Gold (1st) and silver (2nd/3rd) read as medals; the rest use
// the standard blue accent. All pairs keep the same size — only width differs.
const RANK_THEME: Record<CardRank, RankTheme> = {
    0: {
        card: 'border-amber-300 hover:border-amber-400 dark:border-amber-500/50 dark:hover:border-amber-400',
        ribbon: 'from-amber-400/40 via-amber-300/20 to-transparent dark:from-amber-400/30',
        ring: 'ring-amber-100 dark:ring-amber-500/30',
        fallback: 'from-amber-400 to-amber-600',
        role: 'text-amber-700 dark:text-amber-300',
    },
    1: {
        card: 'border-brand-border hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500',
        ribbon: 'from-slate-300/50 via-slate-200/25 to-transparent dark:from-slate-500/40',
        ring: 'ring-slate-100 dark:ring-slate-600/40',
        fallback: 'from-slate-400 to-slate-600',
        role: 'text-slate-600 dark:text-slate-300',
    },
    2: {
        card: 'border-brand-border hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500',
        ribbon: 'from-slate-300/50 via-slate-200/25 to-transparent dark:from-slate-500/40',
        ring: 'ring-slate-100 dark:ring-slate-600/40',
        fallback: 'from-slate-400 to-slate-600',
        role: 'text-slate-600 dark:text-slate-300',
    },
    3: {
        card: 'border-brand-border hover:border-brand dark:hover:border-brand/70',
        ribbon: 'from-brand/20 via-brand/10 to-transparent dark:from-brand/25',
        ring: 'ring-white dark:ring-gray-900',
        fallback: 'from-brand to-accent-brand',
        role: 'text-brand-ink',
    },
};

// Width per rank. Medals are given a bounded width (not full-page) so each
// medal row centers nicely instead of stretching into an empty full-width bar.
// Rank 0 is the widest (champion), ranks 1–2 share a centered row, and the rest
// form a responsive 1/2/3/4-column set.
const RANK_WIDTH: Record<CardRank, string> = {
    0: 'w-full max-w-md',
    1: 'w-full max-w-xs',
    2: 'w-full max-w-xs',
    3: 'w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.3333%-0.8333rem)] xl:w-[calc(25%-0.9375rem)]',
};

/**
 * A portrait-style recognition card: a square, fully-rounded avatar overlapping
 * a soft colored ribbon, with the honoree's name centered beneath it followed by
 * their role, a short note and the recognition date. Centered content keeps the
 * layout identical in RTL and LTR. Medals (ranks 0–2) are colored gold/silver.
 */
function HonoreeCard({ post, rank }: { post: ShowcasePost; rank: CardRank }) {
    const theme = RANK_THEME[rank];
    const image = post.images?.[0];
    const name = post.honoree ?? post.title;
    // When a person is honored, the post title is their role/award label.
    const role = post.honoree ? post.title : null;

    return (
        <article
            className={`group relative flex h-full w-full flex-col items-center overflow-hidden rounded-3xl border bg-brand-soft text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${theme.card}`}
        >
            {/* Decorative ribbon behind the avatar. */}
            <div
                aria-hidden="true"
                className={`h-16 w-full bg-gradient-to-br ${theme.ribbon}`}
            />

            <div className="-mt-12 flex w-full flex-col items-center px-5 pb-6">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        loading="lazy"
                        className={`aspect-square h-24 w-24 rounded-full object-cover shadow-md ring-4 transition duration-300 group-hover:scale-[1.04] ${theme.ring}`}
                    />
                ) : (
                    <div
                        className={`flex aspect-square h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${theme.fallback} text-3xl font-bold text-white shadow-md ring-4 ${theme.ring}`}
                    >
                        {name.slice(0, 1).toUpperCase()}
                    </div>
                )}

                <p className="mt-3 text-base leading-snug font-semibold text-slate-900 dark:text-white">
                    {name}
                </p>

                {role ? (
                    <p className={`mt-1 text-sm font-medium ${theme.role}`}>
                        {role}
                    </p>
                ) : null}

                {post.excerpt ? (
                    <p className="mt-3 max-w-prose text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {post.excerpt}
                    </p>
                ) : null}

                {post.created_at ? (
                    <span className="mt-4 inline-flex items-center rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {post.created_at}
                    </span>
                ) : null}
            </div>
        </article>
    );
}

/**
 * Podium layout. The top three (medals) are placed in their own centered rows
 * — the champion alone on the first row, the two runners-up sharing the next —
 * so they read as a clear 1-2-3 podium. The remaining cards flow in a wrapping,
 * centered set whose final partial row centers automatically (no orphaned cards).
 * Every row uses flex + `justify-center`, keeping the layout identical in RTL/LTR.
 */
function PostsGrid({ posts }: { posts: ShowcasePost[] }) {
    const champion = posts.slice(0, 1);
    const runnersUp = posts.slice(1, 3);
    const others = posts.slice(3);

    const renderCard = (post: ShowcasePost, index: number) => {
        const rank = rankOf(index);

        return (
            <Reveal
                key={post.id}
                className={RANK_WIDTH[rank]}
                delay={index * 40}
            >
                <HonoreeCard post={post} rank={rank} />
            </Reveal>
        );
    };

    return (
        <div className="space-y-5">
            {/* Row 1: champion, centered on its own. */}
            {champion.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-5">
                    {champion.map((post, i) => renderCard(post, i))}
                </div>
            ) : null}

            {/* Row 2: the two runners-up, centered together. */}
            {runnersUp.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-5">
                    {runnersUp.map((post, i) => renderCard(post, i + 1))}
                </div>
            ) : null}

            {/* Remaining cards: responsive wrapping set, final row centered. */}
            {others.length > 0 ? (
                <div className="flex flex-wrap items-stretch justify-center gap-5">
                    {others.map((post, i) => renderCard(post, i + 3))}
                </div>
            ) : null}
        </div>
    );
}

export default function ShowcaseSection({
    groups,
    headingKey = 'showcase.title',
    withHeading = true,
    filterable = false,
}: {
    groups: ShowcaseGroup[];
    headingKey?: string;
    withHeading?: boolean;
    /**
     * When true (the full showcase page), show a category tab bar with counts
     * and render one category at a time. When false (home-page fallback), stack
     * every category with its own heading.
     */
    filterable?: boolean;
}) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';

    // Hooks run unconditionally (before the empty-groups early return) so the
    // component stays a valid React component even with no recognition content.
    const [activeType, setActiveType] = useState<string>(groups[0]?.type ?? '');

    const activeGroup = useMemo(
        () => groups.find((g) => g.type === activeType) ?? groups[0],
        [groups, activeType],
    );

    if (groups.length === 0) {
        return (
            <section className="rounded-3xl bg-brand-soft p-6 text-center shadow-sm md:p-10">
                <p className="text-slate-500 dark:text-slate-400">
                    {t('showcase.empty')}
                </p>
            </section>
        );
    }

    return (
        <section
            dir={i18n.dir()}
            className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}
        >
            {withHeading ? (
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                        {t(headingKey)}
                    </h2>
                    <Link
                        href="/school/showcase"
                        className="rounded-xl border border-brand-border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/60 dark:text-slate-200 dark:hover:bg-gray-800/60"
                    >
                        {t('showcase.viewAll')}
                    </Link>
                </div>
            ) : null}

            {filterable ? (
                <>
                    {/* Category switcher with live counts. */}
                    <div
                        role="tablist"
                        aria-label={t(headingKey)}
                        className="flex flex-wrap gap-2"
                    >
                        {groups.map((group) => {
                            const active = group.type === activeGroup?.type;

                            return (
                                <button
                                    key={group.type}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setActiveType(group.type)}
                                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                                        active
                                            ? 'bg-brand text-brand-fg shadow-sm'
                                            : 'border border-brand-border text-slate-700 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-gray-800/60'
                                    }`}
                                >
                                    {t(
                                        `showcase.categories.${categoryKey(group.type)}`,
                                    )}
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                            active
                                                ? 'bg-white/25 text-white'
                                                : 'bg-brand-soft text-slate-500 dark:text-slate-400'
                                        }`}
                                    >
                                        {group.posts.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {activeGroup ? (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-brand-ink">
                                {t(
                                    activeGroup.labelKey ?? activeGroup.label,
                                    activeGroup.label,
                                )}
                            </h3>
                            <PostsGrid posts={activeGroup.posts} />
                        </div>
                    ) : null}
                </>
            ) : (
                groups.map((group) => (
                    <div key={group.type} className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-ink">
                            {t(group.labelKey ?? group.label, group.label)}
                        </h3>
                        <PostsGrid posts={group.posts} />
                    </div>
                ))
            )}
        </section>
    );
}
