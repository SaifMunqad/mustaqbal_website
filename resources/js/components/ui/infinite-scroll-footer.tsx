import LoadingSpinner from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

interface InfiniteScrollFooterProps {
    /** Sentinel ref returned by `useInfinitePagination`. */
    sentinelRef: RefObject<HTMLDivElement | null>;
    loading: boolean;
    hasMore: boolean;
    error?: boolean;
    /** Loads the next page manually (also used to retry after an error). */
    onLoadMore: () => void;
    /** Show "end of list" once every page is loaded (only for paginated lists). */
    showEnd?: boolean;
    className?: string;
}

const buttonClass =
    'rounded-full border border-brand-border bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand hover:text-brand-ink dark:text-slate-200 dark:hover:border-brand dark:hover:text-brand-ink';

/**
 * Shared end-of-list row for infinite-scroll listings: it owns the observed
 * sentinel and the loading status, and falls back to a "load more" button when
 * the observer is unavailable or a page failed.
 */
export default function InfiniteScrollFooter({
    sentinelRef,
    loading,
    hasMore,
    error = false,
    onLoadMore,
    showEnd = false,
    className,
}: InfiniteScrollFooterProps) {
    const { t } = useTranslation();

    return (
        <div
            ref={sentinelRef}
            className={cn(
                'flex min-h-14 items-center justify-center pt-6',
                className,
            )}
        >
            {loading ? (
                <LoadingSpinner size="sm" label={t('pagination.loading')} />
            ) : error ? (
                <button
                    type="button"
                    onClick={onLoadMore}
                    className={buttonClass}
                >
                    {t('pagination.retry')}
                </button>
            ) : hasMore ? (
                <button
                    type="button"
                    onClick={onLoadMore}
                    className={buttonClass}
                >
                    {t('pagination.loadMore')}
                </button>
            ) : showEnd ? (
                <span className="text-sm text-slate-400 dark:text-slate-500">
                    {t('pagination.end')}
                </span>
            ) : null}
        </div>
    );
}
