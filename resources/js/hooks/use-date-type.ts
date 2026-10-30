import {
    DATE_TYPE_STORAGE_KEY,
    DEFAULT_DATE_TYPE,
    isDateType,
    type DateType,
} from '@/lib/date-type';
import { useCallback, useSyncExternalStore } from 'react';

/**
 * System-wide date-type preference backed by localStorage.
 *
 * Every screen (public pages and dashboard) reads the calendar through this
 * store, so one switcher selection updates all pickers, tables and cards at
 * once — and survives reloads and later visits because it lives in the
 * browser's localStorage. First-time visitors get `DEFAULT_DATE_TYPE` (the
 * Afghan Solar Hijri calendar).
 */

// Cached snapshot so `getSnapshot` stays referentially stable between renders
// (useSyncExternalStore re-reads it on every change notification).
let cached: DateType | null = null;
const listeners = new Set<() => void>();

const readStored = (): DateType => {
    try {
        const stored = window.localStorage.getItem(DATE_TYPE_STORAGE_KEY);

        return isDateType(stored) ? stored : DEFAULT_DATE_TYPE;
    } catch {
        // Storage can be unavailable (private mode); fall back to the default.
        return DEFAULT_DATE_TYPE;
    }
};

const getSnapshot = (): DateType => {
    if (cached === null) {
        cached = readStored();
    }

    return cached;
};

// Server rendering has no browser storage; clients re-read after hydration.
const getServerSnapshot = (): DateType => DEFAULT_DATE_TYPE;

const emit = () => listeners.forEach((listener) => listener());

// Another tab changed the preference: drop the cache and re-render subscribers.
const handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== null && event.key !== DATE_TYPE_STORAGE_KEY) {
        return;
    }

    cached = readStored();
    emit();
};

const subscribe = (listener: () => void) => {
    if (listeners.size === 0 && typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorageEvent);
    }

    listeners.add(listener);

    return () => {
        listeners.delete(listener);

        if (listeners.size === 0 && typeof window !== 'undefined') {
            window.removeEventListener('storage', handleStorageEvent);
        }
    };
};

/** Persist the choice and notify every mounted consumer. */
export function setDateTypePreference(next: DateType) {
    cached = next;

    try {
        window.localStorage.setItem(DATE_TYPE_STORAGE_KEY, next);
    } catch {
        // Keep the in-memory selection when storage is blocked.
    }

    emit();
}

export function useDateType() {
    const dateType = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    const setDateType = useCallback((next: DateType) => {
        setDateTypePreference(next);
    }, []);

    return { dateType, setDateType } as const;
}

export default useDateType;
