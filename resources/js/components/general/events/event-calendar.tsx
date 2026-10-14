import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
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

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function EventCalendar({
    events,
    onSelectEvent,
}: {
    events: CalendarEvent[];
    onSelectEvent?: (event: CalendarEvent) => void;
}) {
    const { i18n, t } = useTranslation();
    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;
    const [cursor, setCursor] = useState(() => startOfDay(new Date()));

    const grid = useMemo(() => {
        const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const startWeekday = firstDay.getDay(); // 0 = Sunday
        const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

        const cells: (Date | null)[] = [];
        for (let i = 0; i < startWeekday; i += 1) {
            cells.push(null);
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
            cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
        }
        while (cells.length % 7 !== 0) {
            cells.push(null);
        }
        return cells;
    }, [cursor]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        events.forEach((event) => {
            const key = startOfDay(new Date(event.start_at)).toISOString();
            map.set(key, [...(map.get(key) ?? []), event]);
        });
        return map;
    }, [events]);

    const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    const weekdays = useMemo(
        () =>
            Array.from({ length: 7 }, (_, index) => {
                const date = new Date(2024, 0, index); // Sunday-first reference week
                return weekdayFormat.format(date);
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [locale],
    );

    const today = startOfDay(new Date());

    return (
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-gray-900 md:p-6">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {monthFormat.format(cursor)}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label={t('events.prevMonth')}
                        onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                        className="rounded-lg border border-border p-1.5 transition hover:bg-muted"
                    >
                        <ChevronLeftIcon className="size-4" />
                    </button>
                    <button
                        type="button"
                        aria-label={t('events.nextMonth')}
                        onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                        className="rounded-lg border border-border p-1.5 transition hover:bg-muted"
                    >
                        <ChevronRightIcon className="size-4" />
                    </button>
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
                {grid.map((date, index) => {
                    if (!date) {
                        return <div key={`empty-${index}`} className="min-h-16 rounded-lg" />;
                    }

                    const dayEvents = eventsByDay.get(startOfDay(date).toISOString()) ?? [];
                    const isToday = isSameDay(date, today);

                    return (
                        <div
                            key={date.toISOString()}
                            className={cn(
                                'min-h-16 rounded-lg border p-1 text-start align-top',
                                isToday
                                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
                                    : 'border-slate-100 dark:border-slate-800',
                            )}
                        >
                            <span className={cn('text-xs', isToday ? 'font-bold text-blue-700' : 'text-slate-500')}>
                                {date.getDate()}
                            </span>
                            <div className="mt-1 space-y-1">
                                {dayEvents.slice(0, 2).map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => onSelectEvent?.(event)}
                                        className="block w-full truncate rounded bg-blue-600 px-1 py-0.5 text-start text-[10px] text-white transition hover:bg-blue-700"
                                        title={event.title}
                                    >
                                        {event.title}
                                    </button>
                                ))}
                                {dayEvents.length > 2 ? (
                                    <span className="text-[10px] text-slate-400">{t('events.more', { count: dayEvents.length - 2 })}</span>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
