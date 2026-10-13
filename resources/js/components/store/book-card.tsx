import { BookOpenIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

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

interface Props {
    book: BookCardData;
}

/**
 * Shared book card used on the library listing and the "you may also like"
 * related section on the book detail page. Shows the cover with overlaid
 * category (top start), a hover-revealed download button (top end), and the
 * title (bottom start) with publisher/year (bottom end).
 */
export default function BookCard({ book }: Props) {
    const { t } = useTranslation();

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md dark:border-slate-700 dark:bg-gray-900">
            <Link href={`/store/books/${book.slug}`} className="relative block">
                {book.thumbnail ? (
                    <img src={book.thumbnail} alt={book.title} className="aspect-[3/4] w-full object-cover" />
                ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <BookOpenIcon className="size-10" />
                    </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">{book.title}</h3>
                    {book.publisher || book.published_year ? (
                        <p className="shrink-0 text-end text-xs text-white/80">
                            {[book.publisher, book.published_year].filter(Boolean).join(' · ')}
                        </p>
                    ) : null}
                </div>
                {book.category ? (
                    <span className="absolute top-2 start-2 z-10 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-blue-600 shadow-sm backdrop-blur-sm">
                        {book.category}
                    </span>
                ) : null}
            </Link>
            <a
                href={book.download_url ?? `/store/books/${book.slug}`}
                aria-label={t('store.download')}
                title={t('store.download')}
                className="absolute top-2 end-2 z-10 flex size-9 items-center justify-center rounded-full border border-slate-300 bg-white/80 text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white hover:text-slate-900 opacity-0 focus:opacity-100 group-hover:opacity-100"
            >
                <ArrowDownTrayIcon className="size-5" />
            </a>
        </div>
    );
}
