/**
 * Reactive `max-width: 767px` check built on `useSyncExternalStore`.
 *
 * Subscribing through the browser's own media query list keeps every consumer in
 * sync with the current breakpoint without resize listeners of its own.
 */
import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

function mediaQueryListener(callback: (event: MediaQueryListEvent) => void) {
    mql.addEventListener('change', callback);

    return () => {
        mql.removeEventListener('change', callback);
    };
}

function isSmallerThanBreakpoint() {
    return mql.matches;
}

export function useIsMobile() {
    return useSyncExternalStore(mediaQueryListener, isSmallerThanBreakpoint);
}
