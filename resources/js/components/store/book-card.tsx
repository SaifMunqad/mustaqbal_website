/**
 * Bookstore card for a single title.
 *
 * Shows the cover (or a book glyph), publication details and category, plus a
 * direct download action when a file is available. Built on the shared
 * `OverlayMediaCard` so it matches the media list.
 */
import { ArrowDownTrayIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import OverlayMediaCard from '@/components/general/cards/overlay-media-card';

export interface BookCardData {
    id: number;
    title: string;
    slug: string;
    published_year?: number | null;
    publisher?: string | null;
    thumbnail?: string | null;
    download_url?: string | null;
    category?: string | null;
}

interface BookCardProps {
    book: BookCardData;
}

/**
 * Shared book card used on the library listing and the "you may also like"
 * related section on the book detail page. It reuses the cover-overlay media
 * card and adds a hover-revealed download button on top.
 */
export default function BookCard({ book }: BookCardProps) {
    const { t } = useTranslation();
    const subtitle = [book.publisher, book.published_year].filter(Boolean).join(' · ');

    return (
        <OverlayMediaCard
            href={`/store/books/${book.slug}`}
            image={book.thumbnail}
            title={book.title}
            subtitle={subtitle || null}
            badge={book.category}
            fallbackIcon={<BookOpenIcon className="size-10" />}
            overlay={
                <a
                    href={book.download_url ?? `/store/books/${book.slug}`}
                    aria-label={t('store.download')}
                    title={t('store.download')}
                    className="absolute top-2 end-2 z-10 flex size-9 items-center justify-center rounded-full border border-slate-300 bg-white/80 text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white hover:text-slate-900 opacity-0 focus:opacity-100 group-hover:opacity-100"
                >
                    <ArrowDownTrayIcon className="size-5" />
                </a>
            }
        />
    );
}
