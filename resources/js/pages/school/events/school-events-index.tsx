import EventCalendar, {
    CalendarEvent,
} from '@/components/general/events/event-calendar';
import InfiniteScrollFooter from '@/components/ui/infinite-scroll-footer';
import Reveal from '@/components/ui/reveal';
import { useDateType } from '@/hooks/use-date-type';
import { useInfinitePagination } from '@/hooks/use-infinite-pagination';
import MainLayout from '@/layouts/app/main-layout';
import { formatDate } from '@/lib/date-type';
import type { Paginated } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface EventItem extends CalendarEvent {
    slug: string;
    excerpt?: string | null;
    cover_image?: string | null;
    images?: string[] | null;
    author?: { name: string } | null;
}

function SchoolEventsIndex() {
    const { events, upcoming } = usePage<{
        events: Paginated<EventItem>;
        upcoming: EventItem[];
    }>().props;
    const { t, i18n } = useTranslation();
    const { dateType, setDateType } = useDateType();
    const { items, sentinelRef, loading, hasMore, error, loadMore } =
        useInfinitePagination(events, { prop: 'events' });

    const selectEvent = (event: CalendarEvent) =>
        router.get(`/school/events/${(event as EventItem).slug}`);

    return (
        <>
            <Head title={t('events.title')} />

            <div className="space-y-6">
                <Reveal direction="fade" defaultInView>
                    <section className="rounded-3xl bg-brand-soft p-6 shadow-md md:p-10 dark:bg-brand-deep">
                        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
                            {t('events.title')}
                        </h1>
                        <p className="mt-3 max-w-3xl text-base text-slate-700 dark:text-slate-300">
                            {t('events.subtitle')}
                        </p>
                    </section>
                </Reveal>

                <Reveal>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <EventCalendar
                                events={[...upcoming, ...items]}
                                dateType={dateType}
                                onDateTypeChange={setDateType}
                                onSelectEvent={selectEvent}
                            />
                        </div>
                        <div className="space-y-3 rounded-2xl border border-border bg-brand-soft p-4 shadow-sm">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                {t('events.upcoming')}
                            </h3>
                            {upcoming.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {t('events.none')}
                                </p>
                            ) : (
                                upcoming.map((event) => (
                                    <Link
                                        key={event.id}
                                        href={`/school/events/${event.slug}`}
                                        className="block rounded-xl border border-slate-100 p-3 transition hover:border-brand-border hover:bg-brand-soft/50 dark:hover:bg-slate-800"
                                    >
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {event.title}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatDate(
                                                event.start_at,
                                                dateType,
                                                i18n.language,
                                                { timeStyle: 'short' },
                                            )}
                                        </p>
                                        {event.location ? (
                                            <p className="text-xs text-slate-400">
                                                {event.location}
                                            </p>
                                        ) : null}
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </Reveal>

                <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((event, index) => {
                        const image =
                            event.cover_image ?? event.images?.[0] ?? null;
                        return (
                            <Reveal key={event.id} delay={index * 45}>
                                <Link
                                    href={`/school/events/${event.slug}`}
                                    className="block overflow-hidden rounded-2xl border border-brand-border bg-brand-soft transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    {image ? (
                                        <img
                                            src={image}
                                            alt={event.title}
                                            className="h-40 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-40 w-full items-center justify-center bg-brand text-brand-fg">
                                            <span className="px-4 text-center text-sm font-semibold">
                                                {formatDate(
                                                    event.start_at,
                                                    dateType,
                                                    i18n.language,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="space-y-1 p-4">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {event.title}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatDate(
                                                event.start_at,
                                                dateType,
                                                i18n.language,
                                                { timeStyle: 'short' },
                                            )}
                                        </p>
                                        {event.excerpt ? (
                                            <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                                                {event.excerpt}
                                            </p>
                                        ) : null}
                                    </div>
                                </Link>
                            </Reveal>
                        );
                    })}
                </section>

                <InfiniteScrollFooter
                    sentinelRef={sentinelRef}
                    loading={loading}
                    hasMore={hasMore}
                    error={error}
                    onLoadMore={loadMore}
                    showEnd={events.last_page > 1}
                />
            </div>
        </>
    );
}

SchoolEventsIndex.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolEventsIndex;
