import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
    /**
     * Fraction of the element that must be visible before triggering (0–1).
     * Defaults to 0 so the trigger is driven purely by `rootMargin`: this
     * keeps the reveal timing consistent regardless of how tall the wrapped
     * element is. A fractional threshold compounds with `rootMargin` and
     * delays tall sections until ~half of them scroll in.
     */
    threshold?: number;
    /**
     * Offset around the root bounds. A negative bottom margin (e.g.
     * '0px 0px -10% 0px') reveals only once the element has risen ~10% above
     * the bottom edge; tune the percentage to reveal earlier/later.
     */
    rootMargin?: string;
    /** Stop observing once the element has been revealed. */
    once?: boolean;
    /** Initial `inView` value before the observer runs. */
    initial?: boolean;
}

/**
 * True when the browser can drive reveal animations. Falls back to
 * "always visible" when IntersectionObserver is missing or the user asked
 * for reduced motion, so content can never get stuck at opacity 0.
 */
function canAnimate(): boolean {
    if (typeof window === 'undefined') return false;
    if (typeof window.IntersectionObserver === 'undefined') return false;
    try {
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return true;
    }
}

/**
 * Lightweight IntersectionObserver wrapper returning { ref, inView }.
 * SSR-safe: during server render (and hydration) nothing observes; the
 * effect re-checks `prefers-reduced-motion` live so a mid-session OS
 * setting change is picked up on the next mount.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
    threshold = 0,
    rootMargin = '0px 0px -10% 0px',
    once = true,
    initial = false,
}: UseInViewOptions = {}) {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(initial);

    useEffect(() => {
        // No observer support or reduced motion: treat as visible immediately.
        if (!canAnimate()) {
            if (initial) return;
            const id = window.setTimeout(() => setInView(true), 0);
            return () => window.clearTimeout(id);
        }

        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    if (once) observer.unobserve(element);
                } else if (!once) {
                    setInView(false);
                }
            },
            { threshold, rootMargin },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, rootMargin, once, initial]);

    return { ref, inView };
}
