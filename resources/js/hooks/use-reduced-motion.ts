import { useEffect, useState } from 'react';

/**
 * Live `prefers-reduced-motion: reduce` watcher. SSR-safe: the server
 * render assumes motion is allowed and the effect re-reads the media
 * query on mount, so a mid-session OS setting change is picked up too.
 * UI should degrade to instant (no duration) transitions when true.
 */
export function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(query.matches);

        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    return reduced;
}

export default useReducedMotion;
