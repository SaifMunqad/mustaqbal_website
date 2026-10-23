import type { Paginated } from '@/types';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UseInfinitePaginationOptions {
    /** Key of the Inertia prop that holds the paginator, e.g. "articles". */
    prop: string;
    /**
     * Changes to this value (search term, active filter, ...) restart the list
     * from the paginator the server just rendered instead of appending to the
     * previous result set.
     */
    resetKey?: string;
    /**
     * How far ahead of the viewport the next page is fetched, measured in
     * screen heights (default 2). The sentinel starts the request while that
     * much empty scroll is still left below the fold, so the rows are already
     * rendered by the time the reader arrives — and because the observer is
     * re-armed after every page, the following page keeps loading in the
     * background for as long as the sentinel stays inside that window.
     */
    prefetchScreens?: number;
}

interface ListState<T> {
    /** Identity the accumulated list belongs to (`resetKey` + locale). */
    key: string;
    items: T[];
    nextPageUrl: string | null;
}

interface StatusState {
    key: string;
    loading: boolean;
    error: boolean;
}

/**
 * Bottom IntersectionObserver margin, in pixels, for a `prefetchScreens`
 * lead distance. Viewport based (not a fixed pixel value) so the lead time is
 * the same amount of scrolling on a phone and on a desktop monitor.
 */
function usePrefetchMargin(prefetchScreens: number): string {
    const [viewportHeight, setViewportHeight] = useState(() =>
        typeof window === 'undefined' ? 0 : window.innerHeight,
    );

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const update = () => {
            const next = window.innerHeight;

            // Ignore small viewport nudges (mobile URL bar, scrollbar) so the
            // observer is not torn down and rebuilt on every scroll frame.
            setViewportHeight((previous) =>
                Math.abs(previous - next) > 48 ? next : previous,
            );
        };

        update();
        window.addEventListener('resize', update);

        return () => window.removeEventListener('resize', update);
    }, []);

    return `0px 0px ${Math.round(viewportHeight * prefetchScreens)}px 0px`;
}

/**
 * Global infinite-scroll pagination for Laravel length-aware paginators.
 *
 * The first page always comes from the server render; later pages are fetched
 * with an Inertia partial reload (`only: [prop]`) to `next_page_url`, so CSRF,
 * asset versioning and query strings are handled by Inertia itself. Pages are
 * appended (de-duplicated by `id`) and a sentinel observed with
 * IntersectionObserver streams the next page well before it is reachable, so
 * scrolling never has to wait on a request.
 *
 * The list is keyed by `resetKey` + active locale: when the server renders a
 * different collection (filters, search, language switch) the accumulated
 * pages are dropped on the next render instead of mixing two result sets.
 *
 * @example
 * const { items, sentinelRef, loading, hasMore, error, loadMore } =
 *     useInfinitePagination(articles, { prop: 'articles' });
 */
export function useInfinitePagination<T extends { id: number }>(
    paginator: Paginated<T>,
    { prop, resetKey = '', prefetchScreens = 2 }: UseInfinitePaginationOptions,
) {
    const { i18n } = useTranslation();
    const rootMargin = usePrefetchMargin(prefetchScreens);

    // A locale switch reloads the page server-side, so pages cached in the
    // previous language must be dropped as well.
    const key = `${resetKey}|${i18n.language}`;

    const [list, setList] = useState<ListState<T>>({
        key,
        items: paginator.data,
        nextPageUrl: paginator.next_page_url,
    });
    const [status, setStatus] = useState<StatusState>({
        key,
        loading: false,
        error: false,
    });

    // The server rendered a new collection (filters, search, locale switch):
    // derive the displayed list from that fresh page. Deriving keeps this safe
    // during render — no state-sync effect needed.
    const activeList: ListState<T> =
        list.key === key
            ? list
            : {
                  key,
                  items: paginator.data,
                  nextPageUrl: paginator.next_page_url,
              };
    const activeStatus: StatusState =
        status.key === key ? status : { key, loading: false, error: false };

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    // Guards against the observer and the fallback button firing together.
    const inFlight = useRef(false);
    const keyRef = useRef(key);

    useEffect(() => {
        keyRef.current = key;
    }, [key]);

    const loadMore = useCallback(() => {
        const url = activeList.nextPageUrl;

        if (!url || inFlight.current) {
            return;
        }

        const requestKey = key;
        let succeeded = false;

        inFlight.current = true;
        setStatus({ key: requestKey, loading: true, error: false });

        router.get(
            url,
            {},
            {
                only: [prop],
                preserveState: true,
                preserveScroll: true,
                preserveUrl: true,
                showProgress: false,
                onSuccess: (page) => {
                    const nextPage = page.props[prop] as
                        | Paginated<T>
                        | undefined;

                    if (!nextPage) {
                        return;
                    }

                    succeeded = true;

                    // A reset (filter change, locale switch) happened while the
                    // request was in flight: its rows belong to the old result set.
                    if (keyRef.current !== requestKey) {
                        return;
                    }

                    setList((previous) => {
                        const base =
                            previous.key === requestKey
                                ? previous.items
                                : activeList.items;
                        const known = new Set(base.map((item) => item.id));

                        return {
                            key: requestKey,
                            items: [
                                ...base,
                                ...nextPage.data.filter(
                                    (item) => !known.has(item.id),
                                ),
                            ],
                            nextPageUrl: nextPage.next_page_url,
                        };
                    });
                },
                onFinish: () => {
                    inFlight.current = false;

                    if (keyRef.current !== requestKey) {
                        return;
                    }

                    setStatus({
                        key: requestKey,
                        loading: false,
                        error: !succeeded,
                    });
                },
            },
        );
    }, [activeList.items, activeList.nextPageUrl, key, prop]);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (
            !sentinel ||
            !activeList.nextPageUrl ||
            activeStatus.loading ||
            activeStatus.error ||
            typeof IntersectionObserver === 'undefined'
        ) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    loadMore();
                }
            },
            { rootMargin },
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [
        activeList.nextPageUrl,
        activeStatus.error,
        activeStatus.loading,
        loadMore,
        rootMargin,
    ]);

    return {
        /** Every page loaded so far, in server order. */
        items: activeList.items,
        /** True while another page can still be fetched. */
        hasMore: activeList.nextPageUrl !== null,
        loading: activeStatus.loading,
        /** A page failed to load; show a retry affordance instead of auto-loading. */
        error: activeStatus.error,
        total: paginator.total,
        /** Manual trigger, also used as the retry action. */
        loadMore,
        /** Attach to the sentinel element at the end of the list. */
        sentinelRef,
    };
}
