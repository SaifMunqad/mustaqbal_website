/**
 * Reactive `max-width: 767px` check built on `useSyncExternalStore`.
 *
 * Subscribing through the browser's own media query list keeps every consumer in
 * sync with the current breakpoint without resize listeners of its own.
 */
import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

// Created lazily so the module never touches `window` at import time; the server
// bundle imports this file during SSR and has no `window` global.
let mql: MediaQueryList | null = null;

function getMediaQueryList() {
    if (!mql) {
        mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    }

    return mql;
}

function mediaQueryListener(callback: (event: MediaQueryListEvent) => void) {
    const list = getMediaQueryList();
    list.addEventListener('change', callback);

    return () => {
        list.removeEventListener('change', callback);
    };
}

function isSmallerThanBreakpoint() {
    return getMediaQueryList().matches;
}

// Server render has no viewport, so report the desktop layout and let the client
// hydrate to the real breakpoint.
function isSmallerThanBreakpointOnServer() {
    return false;
}

export function useIsMobile() {
    return useSyncExternalStore(mediaQueryListener, isSmallerThanBreakpoint, isSmallerThanBreakpointOnServer);
}
