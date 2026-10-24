/**
 * Generic media card for bookstore/search results that are not books (articles,
 * videos, documents). Wraps `OverlayMediaCard` with a document fallback icon.
 */
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import OverlayMediaCard from '@/components/general/cards/overlay-media-card';

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
 * Overlay-style card shared by the search page for articles and events. It is a
 * thin wrapper over the cover-overlay media card, supplying the document icon as
 * the image fallback.
 */
export default function MediaCard({ item }: MediaCardProps) {
    return (
        <OverlayMediaCard
            href={item.href}
            image={item.image}
            title={item.title}
            subtitle={item.subtitle}
            badge={item.badge}
            fallbackIcon={<DocumentTextIcon className="size-10" />}
        />
    );
}
