import DateObject from 'react-date-object';
import arabic from 'react-date-object/calendars/arabic';
import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import arabic_ar from 'react-date-object/locales/arabic_ar';
import arabic_en from 'react-date-object/locales/arabic_en';
import arabic_fa from 'react-date-object/locales/arabic_fa';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import persian_ar from 'react-date-object/locales/persian_ar';
import persian_en from 'react-date-object/locales/persian_en';
import persian_fa from 'react-date-object/locales/persian_fa';

/**
 * Date types the visitor can pick on the public events pages. `gregorian` is
 * used for formatting through `Intl`, the other two rely on `react-date-object`
 * so the month grid and the printed dates share one calendar.
 */
export type DateType = 'gregorian' | 'solar' | 'lunar';

/** localStorage key that keeps the visitor's choice across reloads/visits. */
export const DATE_TYPE_STORAGE_KEY = 'school.dateType';

export const DEFAULT_DATE_TYPE: DateType = 'gregorian';

export const DATE_TYPES: DateType[] = ['gregorian', 'solar', 'lunar'];

export const DATE_TYPE_OPTIONS: { value: DateType; labelKey: string }[] = [
    { value: 'gregorian', labelKey: 'events.dateTypeGregorian' },
    { value: 'solar', labelKey: 'events.dateTypeSolar' },
    { value: 'lunar', labelKey: 'events.dateTypeLunar' },
];

export const isDateType = (value: unknown): value is DateType =>
    DATE_TYPES.includes(value as DateType);

type CalendarDefinition = typeof persian;
type LocaleDefinition = typeof persian_fa;

export interface DateTypeConfig {
    calendar: CalendarDefinition;
    locale: LocaleDefinition;
}

// Afghanistan uses its own Solar Hijri month names, while the bundled Persian
// locales ship the Iranian set. Keep the Afghan spelling for every UI language
// so the month label matches what the audience reads on paper calendars.
const solarMonthsFa: string[][] = [
    ['حمل', 'حمل'],
    ['ثور', 'ثور'],
    ['جوزا', 'جوزا'],
    ['سرطان', 'سرط'],
    ['اسد', 'اسد'],
    ['سنبله', 'سنب'],
    ['میزان', 'میز'],
    ['عقرب', 'عقر'],
    ['قوس', 'قوس'],
    ['جدی', 'جدی'],
    ['دلو', 'دلو'],
    ['حوت', 'حوت'],
];

const solarMonthsPs: string[][] = [
    ['وری', 'وری'],
    ['غویی', 'غویی'],
    ['غبرګولی', 'غبرګ'],
    ['چنګاښ', 'چنګ'],
    ['زمری', 'زمر'],
    ['وږی', 'وږی'],
    ['تله', 'تله'],
    ['لړم', 'لړم'],
    ['لیندۍ', 'لین'],
    ['مرغومی', 'مرغ'],
    ['سلواغه', 'سلوا'],
    ['کب', 'کب'],
];

const persian_fa_af: LocaleDefinition = {
    ...persian_fa,
    name: 'persian_fa_af',
    months: solarMonthsFa,
};

const persian_ps: LocaleDefinition = {
    ...persian_fa,
    name: 'persian_ps',
    months: solarMonthsPs,
};

const persian_ar_af: LocaleDefinition = {
    ...persian_ar,
    name: 'persian_ar_af',
    months: solarMonthsFa,
};

const persian_en_af: LocaleDefinition = {
    ...persian_en,
    name: 'persian_en_af',
    months: [
        ['Hamal', 'Ham'],
        ['Sawr', 'Saw'],
        ['Jawza', 'Jaw'],
        ['Saratan', 'Sar'],
        ['Asad', 'Asa'],
        ['Sunbula', 'Sun'],
        ['Mizan', 'Miz'],
        ['Aqrab', 'Aqr'],
        ['Qaws', 'Qaw'],
        ['Jadi', 'Jad'],
        ['Dalw', 'Dal'],
        ['Hut', 'Hut'],
    ],
};

const solarLocales: Record<string, LocaleDefinition> = {
    fa_AF: persian_fa_af,
    ps: persian_ps,
    ar: persian_ar_af,
};

const lunarLocales: Record<string, LocaleDefinition> = {
    fa_AF: arabic_fa,
    ps: arabic_fa,
    ar: arabic_ar,
};

/**
 * Calendar + locale pair used to render dates in the requested date type.
 *
 * @param dateType the visitor's selected date type.
 * @param language the active UI language, used to localize month/weekday names.
 */
export function getDateTypeConfig(
    dateType: DateType,
    language?: string,
): DateTypeConfig {
    if (dateType === 'solar') {
        return {
            calendar: persian,
            locale: solarLocales[language ?? ''] ?? persian_en_af,
        };
    }

    if (dateType === 'lunar') {
        return {
            calendar: arabic,
            locale: lunarLocales[language ?? ''] ?? arabic_en,
        };
    }

    return { calendar: gregorian, locale: gregorian_en };
}

/**
 * Read the browser/OS calendar preference so the first visit starts on the
 * date type the visitor already uses elsewhere (`Intl` reports e.g. `gregory`,
 * `persian` or `islamic-umalqura`).
 */
export function detectSystemDateType(): DateType {
    if (typeof Intl === 'undefined') {
        return DEFAULT_DATE_TYPE;
    }

    const calendar = new Intl.DateTimeFormat().resolvedOptions().calendar ?? '';

    if (calendar.startsWith('persian')) {
        return 'solar';
    }

    if (calendar.startsWith('islamic')) {
        return 'lunar';
    }

    return 'gregorian';
}

/** Map the i18n language code to the BCP-47 tag `Intl` understands. */
export function intlLocale(language?: string): string {
    return language === 'fa_AF' ? 'fa-AF' : (language ?? 'en');
}

/** Convert any supported value into the given date type's calendar. */
export function toCalendarDate(
    value: string | Date,
    dateType: DateType,
    language?: string,
): DateObject {
    const date = value instanceof Date ? value : new Date(value);
    const { calendar, locale } = getDateTypeConfig(dateType, language);

    return new DateObject({
        date,
        calendar: gregorian,
        locale: gregorian_en,
    }).convert(calendar, locale);
}

/** Stable per-day key (in the selected calendar) for grouping events by day. */
export function dateTypeKey(
    value: string | Date,
    dateType: DateType,
    language?: string,
): string {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return toCalendarDate(date, dateType, language).format('YYYY-MM-DD');
}

interface FormatDateOptions {
    dateStyle?: 'medium' | 'full';
    timeStyle?: 'short';
}

/**
 * Format a date (optionally with its time) in the visitor's date type. Gregorian
 * goes through `Intl` so the output matches the rest of the site; the Hijri
 * calendars are formatted by `react-date-object` with localized digits.
 */
export function formatDate(
    value: string | Date,
    dateType: DateType,
    language?: string,
    options: FormatDateOptions = {},
): string {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return typeof value === 'string' ? value : '';
    }

    const { dateStyle = 'medium', timeStyle } = options;

    if (dateType === 'gregorian') {
        try {
            return new Intl.DateTimeFormat(intlLocale(language), {
                dateStyle,
                timeStyle,
            }).format(date);
        } catch {
            return date.toISOString();
        }
    }

    const calendarDate = toCalendarDate(date, dateType, language);
    const datePart = calendarDate.format(
        dateStyle === 'full' ? 'dddd D MMMM YYYY' : 'D MMMM YYYY',
    );

    return timeStyle
        ? `${datePart} · ${calendarDate.format('HH:mm')}`
        : datePart;
}
