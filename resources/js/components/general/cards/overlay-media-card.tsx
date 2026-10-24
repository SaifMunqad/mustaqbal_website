/**
 * Shared image-first card with a gradient overlay and text sitting over the
 * media.
 *
 * Used by the bookstore and the media list so both areas share one card rhythm.
 * Accepts an `overlay` slot (e.g. a download button) rendered inside the group
 * wrapper, which keeps `group-hover` effects working across the whole surface.
 */
import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface OverlayMediaCardProps {
    href: string;
    image?: string | null;
    title: string;
    subtitle?: string | null;
    badge?: string | null;
    // Icon shown in place of the cover image when no image is available.
    fallbackIcon: ReactNode;
    // Extra content rendered on top of the card (e.g. an absolutely-positioned
    // download button). Kept inside the group wrapper so group-hover works.
    overlay?: ReactNode;
}

/**
 * Cover-image card with a dark bottom gradient carrying the title (start) and an
 * optional subtitle (end), plus an optional badge pinned to the top start.
 * Shared by the library book card and the search media card so both read alike.
 */
export default function OverlayMediaCard({
    href,
    image,
    title,
    subtitle,
    badge,
    fallbackIcon,
    overlay,
}: OverlayMediaCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-brand-border bg-brand-soft transition hover:shadow-md">
            <Link href={href} className="relative block">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="aspect-[3/4] w-full object-cover"
                    />
                ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center bg-brand text-brand-fg">
                        {fallbackIcon}
                    </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">
                        {title}
                    </h3>
                    {subtitle ? (
                        <p className="shrink-0 text-end text-xs text-white/80">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
                {badge ? (
                    <span className="absolute start-2 top-2 z-10 rounded-full bg-brand-fg/90 px-2 py-0.5 text-xs font-medium text-brand shadow-sm backdrop-blur-sm">
                        {badge}
                    </span>
                ) : null}
            </Link>
            {overlay}
        </div>
    );
}
