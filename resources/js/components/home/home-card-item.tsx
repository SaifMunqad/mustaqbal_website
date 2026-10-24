import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export interface HomeCard {
    id: number;
    title: string;
    subtitle?: string | null;
    excerpt?: string | null;
    image?: string | null;
    url?: string | null;
    date?: string | null;
    dir?: string | null;
}

// Cards cycle through three shapes so a row reads as a varied mosaic rather
// than a wall of identical tiles: square (1:1), portrait (taller than wide) and
// landscape (wider than tall). The cover image fills whichever ratio is applied.
export const CARD_SHAPES = [
    'aspect-square',
    'aspect-[3/4]',
    'aspect-[4/3]',
] as const;

export function shapeForIndex(index: number): string {
    return CARD_SHAPES[index % CARD_SHAPES.length];
}

/**
 * Pseudo-random shape pick. A positional cycle reads as a repeating rhythm
 * (1:1 → 3:4 → 4:3 → 1:1 …), so listings that should look shuffled pass a
 * stable seed instead — normally the card id. The seed keeps the choice
 * identical between SSR markup and client hydration (Math.random would
 * mismatch), and the same card keeps its shape on every reload.
 */
export function shapeForSeed(seed: number): string {
    let hash = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
    hash ^= hash >>> 16;

    return CARD_SHAPES[(hash >>> 0) % CARD_SHAPES.length];
}

function useDateFormatter() {
    const { i18n } = useTranslation();
    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;

    return (value?: string | null) => {
        if (!value) {
            return null;
        }
        try {
            return new Intl.DateTimeFormat(locale, {
                dateStyle: 'medium',
            }).format(new Date(value));
        } catch {
            return null;
        }
    };
}

/**
 * Shared image-cover card used on the home page and the articles listing. The
 * image fills the whole card as a cover background; the subtitle is pinned to
 * the top-start and the title/excerpt/date float at the bottom over gradient
 * scrims for legibility. `shapeClass` fixes the card's aspect ratio.
 */
export default function HomeCardItem({
    card,
    shapeClass,
}: {
    card: HomeCard;
    shapeClass: string;
}) {
    const formatDate = useDateFormatter();
    const date = formatDate(card.date);
    const rtl = card.dir === 'rtl';

    // The image fills the whole card as a cover background; the text and CTA
    // float on top over a gradient scrim for legibility. `shapeClass` fixes the
    // card's aspect ratio (square / portrait / landscape).
    const inner = (
        <div
            className={`group relative flex w-full ${shapeClass} flex-col overflow-hidden rounded-2xl border border-brand-border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
        >
            {card.image ? (
                <img
                    src={card.image}
                    alt={card.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-brand text-5xl font-bold text-brand-fg">
                    {card.title.slice(0, 1)}
                </div>
            )}

            {/* Scrims so overlaid text stays readable on any image: a top wash
                behind the subtitle and a stronger bottom wash behind the body. */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

            {card.subtitle || date ? (
                <div
                    dir={card.dir ?? undefined}
                    className="relative z-10 flex items-start justify-between gap-2 p-4"
                >
                    {card.subtitle ? (
                        <p
                            className={`text-xs font-semibold tracking-wide text-brand-ink uppercase ${rtl ? 'text-right' : 'text-left'}`}
                        >
                            {card.subtitle}
                        </p>
                    ) : (
                        <span />
                    )}
                    {date ? (
                        <p className="shrink-0 text-xs text-slate-300">
                            {date}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div
                dir={card.dir ?? undefined}
                className={`relative z-10 mt-auto px-4 pb-4 ${rtl ? 'text-right' : 'text-left'}`}
            >
                <p className="line-clamp-2 font-semibold text-white drop-shadow-sm">
                    {card.title}
                </p>
                {card.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-200">
                        {card.excerpt}
                    </p>
                ) : null}
            </div>
        </div>
    );

    return card.url ? (
        <Link href={card.url} className="block h-full">
            {inner}
        </Link>
    ) : (
        inner
    );
}
