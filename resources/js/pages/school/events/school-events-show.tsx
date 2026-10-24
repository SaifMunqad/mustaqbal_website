import Reveal from '@/components/ui/reveal';
import { useDateType } from '@/hooks/use-date-type';
import MainLayout from '@/layouts/app/main-layout';
import { formatDate } from '@/lib/date-type';
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

/**
 * Event bodies are stored as plain text with blank lines between paragraphs.
 * Rich-text (HTML) bodies cannot be cut safely, so they stay as one block.
 */
function splitParagraphs(body?: string | null): string[] {
    const text = (body ?? '').trim();

    if (!text || /<[a-z][\s\S]*>/i.test(text)) {
        return text ? [text] : [];
    }

    const byBlankLine = text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    return byBlankLine.length > 1
        ? byBlankLine
        : text
              .split(/\n+/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean);
}

function EventParagraphs({ paragraphs }: { paragraphs: string[] }) {
    return (
        <div className="space-y-3">
            {paragraphs.map((paragraph, index) => (
                <p
                    key={`${index}-paragraph`}
                    className="text-sm leading-7 whitespace-pre-wrap text-slate-700 dark:text-slate-300"
                >
                    {paragraph}
                </p>
            ))}
        </div>
    );
}

function SchoolEventsShow() {
    const { event, related } = usePage<{
        event: EventDetail;
        related: EventDetail[];
    }>().props;
    const { t, i18n } = useTranslation();
    const { dateType } = useDateType();

    const images = [event.cover_image, ...(event.images ?? [])].filter(
        (image): image is string => Boolean(image),
    );

    // The text is split in two: the opening half reads beside the cover image
    // at the start of the page, the rest closes it at the end.
    const paragraphs = splitParagraphs(event.body);
    const startCount = Math.ceil(paragraphs.length / 2);
    const startParagraphs = paragraphs.slice(0, startCount);
    const endParagraphs = paragraphs.slice(startCount);
    const coverImage = images[0] ?? null;

    return (
        <>
            <Head title={event.title} />

            <article className="space-y-6 rounded-3xl bg-brand-soft p-6 shadow-sm md:p-10">
                <Reveal direction="fade" defaultInView>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Link
                            href="/school/events"
                            className="text-sm font-medium text-brand-ink underline"
                        >
                            {t('events.back')}
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
                        {event.title}
                    </h1>

                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1">
                            <CalendarDaysIcon className="size-4" />
                            {formatDate(
                                event.start_at,
                                dateType,
                                i18n.language,
                                {
                                    dateStyle: 'full',
                                    timeStyle: 'short',
                                },
                            )}
                        </span>
                        {event.end_at ? (
                            <span className="rounded-full bg-brand-soft px-3 py-1">
                                {t('events.until')}:{' '}
                                {formatDate(
                                    event.end_at,
                                    dateType,
                                    i18n.language,
                                    {
                                        dateStyle: 'full',
                                        timeStyle: 'short',
                                    },
                                )}
                            </span>
                        ) : null}
                        {event.location ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1">
                                <MapPinIcon className="size-4" />
                                {event.location}
                            </span>
                        ) : null}
                    </div>

                    {event.excerpt ? (
                        <p className="mt-4 text-lg text-slate-700 dark:text-slate-300">
                            {event.excerpt}
                        </p>
                    ) : null}
                </Reveal>

                {/* Start section: text on the inline start side, cover image
                    on the inline end side — right/left respectively in RTL. */}
                {startParagraphs.length > 0 || coverImage ? (
                    <Reveal>
                        <section
                            className={`grid gap-6 ${
                                coverImage ? 'md:grid-cols-2' : ''
                            }`.trim()}
                        >
                            {startParagraphs.length > 0 ? (
                                <div className="min-w-0 space-y-3">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {t('events.detailsStart')}
                                    </h2>
                                    <EventParagraphs
                                        paragraphs={startParagraphs}
                                    />
                                </div>
                            ) : null}

                            {coverImage ? (
                                <div className="relative min-h-64 w-full overflow-hidden rounded-2xl">
                                    <img
                                        src={coverImage}
                                        alt={event.title}
                                        className="absolute inset-0 size-full object-cover"
                                    />
                                </div>
                            ) : null}
                        </section>
                    </Reveal>
                ) : null}

                {images.length > 1 ? (
                    <Reveal>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {images.slice(1).map((image, index) => (
                                <img
                                    key={`${index}-${image}`}
                                    src={image}
                                    alt={`${event.title} ${index + 1}`}
                                    className="h-48 w-full rounded-2xl object-cover"
                                />
                            ))}
                        </div>
                    </Reveal>
                ) : null}

                {/* End section: the remaining text, gallery and related events. */}
                {endParagraphs.length > 0 || related.length > 0 ? (
                    <Reveal>
                        <section className="space-y-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                            {endParagraphs.length > 0 ? (
                                <div className="space-y-3">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {t('events.detailsEnd')}
                                    </h2>
                                    <EventParagraphs
                                        paragraphs={endParagraphs}
                                    />
                                </div>
                            ) : null}

                            {related.length > 0 ? (
                                <div>
                                    <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
                                        {t('events.moreUpcoming')}
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        {related.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/school/events/${item.slug}`}
                                                className="rounded-2xl border border-brand-border p-4 transition hover:border-brand hover:bg-brand-soft/50 dark:hover:bg-slate-800"
                                            >
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {formatDate(
                                                        item.start_at,
                                                        dateType,
                                                        i18n.language,
                                                        { timeStyle: 'short' },
                                                    )}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </section>
                    </Reveal>
                ) : null}
            </article>
        </>
    );
}

SchoolEventsShow.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolEventsShow;
