import { useDateType } from '@/hooks/use-date-type';
import { formatDate, type FormatDateOptions } from '@/lib/date-type';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Display formatter that follows the browser-stored date-type preference.
 *
 * Returns a `formatDate(value)` function rendering dates in the visitor's
 * chosen calendar (Afghan Solar Hijri by default) with the active UI
 * language's month names, so every table, card and detail screen reads the
 * same way the switcher says. Empty/invalid values collapse to `placeholder`.
 */
export function useDateFormatter(
    options: FormatDateOptions = {},
    placeholder = '-',
) {
    const { dateType } = useDateType();
    const { i18n } = useTranslation();
    const { dateStyle, timeStyle } = options;

    return useCallback(
        (value?: string | Date | null): string => {
            if (!value) {
                return placeholder;
            }

            return formatDate(value, dateType, i18n.language, {
                dateStyle,
                timeStyle,
            });
        },
        [dateType, i18n.language, dateStyle, timeStyle, placeholder],
    );
}

export default useDateFormatter;
