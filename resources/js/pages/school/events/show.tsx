import MainLayout from '@/layouts/app/main-layout';
import { CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface EventDetail {
    id: number;
    slug: string;
    title: string;
    excerpt?: string | null;
    body?: string | null;
    cover_image?: string | null;
    images?: string[] | null;
    location?: string | null;
    start_at: string;
    end_at?: string | null;
    audience?: string | null;
    author?: { name: string } | null;
}

function formatDateTime(value: string, locale: string) {
    try {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value));
    } catch {
        return value;
    }
}

function EventShowPage() {
    const { event, related } = usePage<{ event: EventDetail; related: EventDetail[] }>().props;
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;

    const images = [event.cover_image, ...(event.images ?? [])].filter((image): image is string => Boolean(image));

    return (
        <>
            <Head title={event.title} />

            <article className="space-y-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900 md:p-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href="/school/events" className="text-sm font-medium text-blue-600 underline">
                        {t('events.back')}
                    </Link>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">{event.title}</h1>

                <div className="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                        <CalendarDaysIcon className="size-4" />
                        {formatDateTime(event.start_at, locale)}
                    </span>
                    {event.end_at ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                            {t('events.until')}: {formatDateTime(event.end_at, locale)}
                        </span>
                    ) : null}
                    {event.location ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                            <MapPinIcon className="size-4" />
                            {event.location}
                        </span>
                    ) : null}
                </div>

                {images[0] ? <img src={images[0]} alt={event.title} className="h-64 w-full rounded-2xl object-cover" /> : null}

                {event.excerpt ? (
                    <p className="text-lg text-slate-700 dark:text-slate-300">{event.excerpt}</p>
                ) : null}

                {event.body ? (
                    <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
                        {event.body}
                    </div>
                ) : null}

                {images.length > 1 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {images.slice(1).map((image, index) => (
                            <img key={`${index}-${image}`} src={image} alt={`${event.title} ${index + 1}`} className="h-48 w-full rounded-2xl object-cover" />
                        ))}
                    </div>
                ) : null}

                {related.length > 0 ? (
                    <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
                        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">{t('events.moreUpcoming')}</h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {related.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/school/events/${item.slug}`}
                                    className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {formatDateTime(item.start_at, locale)}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : null}
            </article>
        </>
    );
}

EventShowPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default EventShowPage;
