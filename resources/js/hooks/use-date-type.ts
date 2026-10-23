import {
    DATE_TYPE_STORAGE_KEY,
    DEFAULT_DATE_TYPE,
    detectSystemDateType,
    isDateType,
    type DateType,
} from '@/lib/date-type';
import { useCallback, useEffect, useState } from 'react';

const readPreference = (): DateType => {
    if (typeof window === 'undefined') {
        return DEFAULT_DATE_TYPE;
    }

    try {
        const stored = window.localStorage.getItem(DATE_TYPE_STORAGE_KEY);

        return isDateType(stored) ? stored : detectSystemDateType();
    } catch {
        // Storage can be unavailable (private mode); fall back to the system.
        return detectSystemDateType();
    }
};

/**
 * Persisted date-type preference for the public events pages. The first visit
 * starts from the browser/OS calendar, and an explicit choice is written to
 * localStorage so it survives reloads and later visits.
 */
export function useDateType() {
    const [dateType, setDateTypeState] = useState<DateType>(DEFAULT_DATE_TYPE);

    useEffect(() => {
        // Read after mount so the server render and first client paint stay
        // identical; the stored/system preference takes over immediately after.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDateTypeState(readPreference());
    }, []);

    const setDateType = useCallback((next: DateType) => {
        setDateTypeState(next);

        try {
            window.localStorage.setItem(DATE_TYPE_STORAGE_KEY, next);
        } catch {
            // Keep the in-memory selection when storage is blocked.
        }
    }, []);

    return { dateType, setDateType } as const;
}

export default useDateType;
