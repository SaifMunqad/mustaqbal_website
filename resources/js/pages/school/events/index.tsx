import EventCalendar, { CalendarEvent } from '@/components/general/events/event-calendar';
import MainLayout from '@/layouts/app/main-layout';
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

function formatDateTime(value: string, locale: string) {
    try {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
    } catch {
        return value;
    }
}

function EventsIndexPage() {
    const { events, upcoming } = usePage<{ events: { data: EventItem[] }; upcoming: EventItem[] }>().props;
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;

    const selectEvent = (event: CalendarEvent) => router.get(`/school/events/${(event as EventItem).slug}`);

    return (
        <>
            <Head title={t('events.title')} />

            <div className="space-y-6">
                <section className="rounded-3xl bg-gradient-to-r from-blue-100 to-purple-100 p-6 shadow-md md:p-10 dark:from-gray-900 dark:to-gray-800">
                    <h1 className="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">{t('events.title')}</h1>
                    <p className="mt-3 max-w-3xl text-base text-slate-700 dark:text-slate-300">{t('events.subtitle')}</p>
                </section>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <EventCalendar events={[...upcoming, ...events.data]} onSelectEvent={selectEvent} />
                    </div>
                    <div className="space-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-gray-900">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{t('events.upcoming')}</h3>
                        {upcoming.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('events.none')}</p>
                        ) : (
                            upcoming.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/school/events/${event.slug}`}
                                    className="block rounded-xl border border-slate-100 p-3 transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                                >
                                    <p className="font-medium text-slate-900 dark:text-white">{event.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {formatDateTime(event.start_at, locale)}
                                    </p>
                                    {event.location ? (
                                        <p className="text-xs text-slate-400">{event.location}</p>
                                    ) : null}
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {events.data.map((event) => {
                        const image = event.cover_image ?? event.images?.[0] ?? null;
                        return (
                            <Link
                                key={event.id}
                                href={`/school/events/${event.slug}`}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-gray-900"
                            >
                                {image ? (
                                    <img src={image} alt={event.title} className="h-40 w-full object-cover" />
                                ) : (
                                    <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                        <span className="px-4 text-center text-sm font-semibold">
                                            {formatDateTime(event.start_at, locale)}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-1 p-4">
                                    <p className="font-semibold text-slate-900 dark:text-white">{event.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {formatDateTime(event.start_at, locale)}
                                    </p>
                                    {event.excerpt ? (
                                        <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                                            {event.excerpt}
                                        </p>
                                    ) : null}
                                </div>
                            </Link>
                        );
                    })}
                </section>
            </div>
        </>
    );
}

EventsIndexPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default EventsIndexPage;
