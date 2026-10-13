import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export interface MediaCardData {
    id: number;
    title: string;
    href: string;
    image?: string | null;
    subtitle?: string | null;
    badge?: string | null;
}

interface MediaCardProps {
    item: MediaCardData;
}

/**
 * Overlay-style card shared by the search page for articles and events. It
 * mirrors the book card (BookCard): cover fills the frame, a dark bottom
 * gradient carries the title (start) and subtitle (end), and an optional badge
 * sits at the top start.
 */
export default function MediaCard({ item }: MediaCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md dark:border-slate-700 dark:bg-gray-900">
            <Link href={item.href} className="relative block">
                {item.image ? (
                    <img src={item.image} alt={item.title} className="aspect-[3/4] w-full object-cover" />
                ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center bg-blue-600 text-white">
                        <DocumentTextIcon className="size-10" />
                    </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">{item.title}</h3>
                    {item.subtitle ? <p className="shrink-0 text-end text-xs text-white/80">{item.subtitle}</p> : null}
                </div>
                {item.badge ? (
                    <span className="absolute top-2 start-2 z-10 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-blue-600 shadow-sm backdrop-blur-sm">
                        {item.badge}
                    </span>
                ) : null}
            </Link>
        </div>
    );
}
