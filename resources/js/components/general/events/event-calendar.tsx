/**
 * Month-grid calendar for the public events page.
 *
 * Renders the selected month in whichever calendar `DateTypeSwitcher` reports,
 * marking days that have events and letting the caller jump to a month. Switching
 * calendars re-projects the same underlying dates, so the highlighted days stay
 * identical across calendar systems.
 */
import DateTypeSwitcher from '@/components/general/events/date-type-switcher';
import {
    dateTypeKey,
    getDateTypeConfig,
    intlLocale,
    toCalendarDate,
    type DateType,
} from '@/lib/date-type';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import DateObject from 'react-date-object';
import { useTranslation } from 'react-i18next';

export interface CalendarEvent {
    id: number;
    title: string;
    slug?: string;
    start_at: string;
    end_at?: string | null;
    location?: string | null;
    audience?: string | null;
}

const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

// Sunday-first reference week used to label the weekday header row.
const REFERENCE_WEEK_START = new Date(2024, 0, 7);

export default function EventCalendar({
    events,
    dateType,
    onDateTypeChange,
    onSelectEvent,
}: {
    events: CalendarEvent[];
    dateType: DateType;
    onDateTypeChange?: (value: DateType) => void;
    onSelectEvent?: (event: CalendarEvent) => void;
}) {
    const { i18n, t } = useTranslation();
    const { calendar, locale } = getDateTypeConfig(dateType, i18n.language);

    // The cursor tracks the visible month in the selected calendar, so paging
    // and the month label stay in sync after a date-type switch.
    const currentMonth = useMemo(() => {
        const today = toCalendarDate(new Date(), dateType, i18n.language);

        return { year: today.year, month: today.month.number };
    }, [dateType, i18n.language]);

    const [cursor, setCursor] = useState(currentMonth);

    useEffect(() => {
        setCursor(currentMonth);
    }, [currentMonth]);

    const { cells, monthLabel } = useMemo(() => {
        const firstOfMonth = new DateObject({
            year: cursor.year,
            month: cursor.month,
            day: 1,
            calendar,
            locale,
        });

        const next: (DateObject | null)[] = [];

        for (let i = 0; i < firstOfMonth.toDate().getDay(); i += 1) {
            next.push(null);
        }

        for (let day = 1; day <= firstOfMonth.month.length; day += 1) {
            next.push(
                new DateObject({
                    year: cursor.year,
                    month: cursor.month,
                    day,
                    calendar,
                    locale,
                }),
            );
        }

        while (next.length % 7 !== 0) {
            next.push(null);
        }

        // Gregorian keeps the familiar `Intl` labels of the rest of the site;
        // the Hijri calendars read their month name from their own locale.
        const monthLabel =
            dateType === 'gregorian'
                ? new Intl.DateTimeFormat(intlLocale(i18n.language), {
                      month: 'long',
                      year: 'numeric',
                  }).format(firstOfMonth.toDate())
                : firstOfMonth.format('MMMM YYYY');

        return { cells: next, monthLabel };
    }, [cursor, calendar, locale, dateType, i18n.language]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        events.forEach((event) => {
            const key = dateTypeKey(event.start_at, dateType, i18n.language);
            map.set(key, [...(map.get(key) ?? []), event]);
        });
        return map;
    }, [events, dateType, i18n.language]);

    const weekdays = useMemo(() => {
        const referenceDay = (index: number) => {
            const date = new Date(REFERENCE_WEEK_START);
            date.setDate(date.getDate() + index);

            return date;
        };

        if (dateType === 'gregorian') {
            const format = new Intl.DateTimeFormat(intlLocale(i18n.language), {
                weekday: 'short',
            });

            return Array.from({ length: 7 }, (_, index) =>
                format.format(referenceDay(index)),
            );
        }

        return Array.from(
            { length: 7 },
            (_, index) =>
                toCalendarDate(referenceDay(index), dateType, i18n.language)
                    .weekDay.shortName,
        );
    }, [dateType, i18n.language]);

    const today = startOfDay(new Date());

    const shiftMonth = (offset: number) =>
        setCursor(({ year, month }) => {
            const next = month + offset;

            if (next < 1) {
                return { year: year - 1, month: 12 };
            }

            if (next > 12) {
                return { year: year + 1, month: 1 };
            }

            return { year, month: next };
        });

    return (
        <div className="rounded-2xl border border-border bg-brand-soft p-4 shadow-sm md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {monthLabel}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label={t('events.prevMonth')}
                        onClick={() => shiftMonth(-1)}
                        className="rounded-lg border border-border p-1.5 transition hover:bg-muted"
                    >
                        <ChevronLeftIcon className="size-4" />
                    </button>
                    <button
                        type="button"
                        aria-label={t('events.nextMonth')}
                        onClick={() => shiftMonth(1)}
                        className="rounded-lg border border-border p-1.5 transition hover:bg-muted"
                    >
                        <ChevronRightIcon className="size-4" />
                    </button>
                    {onDateTypeChange ? (
                        <DateTypeSwitcher
                            value={dateType}
                            onChange={onDateTypeChange}
                        />
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                {weekdays.map((weekday) => (
                    <div key={weekday} className="py-1">
                        {weekday}
                    </div>
                ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((cell, index) => {
                    if (!cell) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="min-h-16 rounded-lg"
                            />
                        );
                    }

                    const dayKey = cell.format('YYYY-MM-DD');
                    const dayEvents = eventsByDay.get(dayKey) ?? [];
                    const cellIsToday = isSameDay(cell.toDate(), today);

                    return (
                        <div
                            key={dayKey}
                            className={cn(
                                'min-h-16 rounded-lg border p-1 text-start align-top',
                                cellIsToday
                                    ? 'border-brand-border bg-brand-soft dark:bg-brand-deep'
                                    : 'border-slate-100 dark:border-slate-800',
                            )}
                        >
                            <span
                                className={cn(
                                    'text-xs',
                                    cellIsToday
                                        ? 'font-bold text-brand-ink'
                                        : 'text-slate-500',
                                )}
                            >
                                {dateType === 'gregorian'
                                    ? cell.day
                                    : cell.format('D')}
                            </span>
                            <div className="mt-1 space-y-1">
                                {dayEvents.slice(0, 2).map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => onSelectEvent?.(event)}
                                        className="block w-full truncate rounded bg-brand px-1 py-0.5 text-start text-[10px] text-brand-fg transition hover:bg-brand-hover"
                                        title={event.title}
                                    >
                                        {event.title}
                                    </button>
                                ))}
                                {dayEvents.length > 2 ? (
                                    <span className="text-[10px] text-slate-400">
                                        {t('events.more', {
                                            count: dayEvents.length - 2,
                                        })}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
