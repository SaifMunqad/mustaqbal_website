import { useCallback, useEffect, useState } from 'react';

/**
 * Dirty tracking for one settings section.
 *
 * Every section owns its edits locally (so switching tabs never drops a draft)
 * and compares the current serialized state against the last saved snapshot, so
 * the tab strip can flag exactly which sections still need a save.
 *
 * @param value Current section state; must serialize deterministically.
 * @param onDirtyChange Reports the flag upward for the tab dots and the
 *   unsaved-changes guard.
 */
export function useSectionDirty(
    value: unknown,
    onDirtyChange: (dirty: boolean) => void,
) {
    const serialized = JSON.stringify(value);
    const [baseline, setBaseline] = useState(serialized);
    const dirty = serialized !== baseline;

    useEffect(() => {
        onDirtyChange(dirty);
    }, [dirty, onDirtyChange]);

    // Re-baseline after a successful save so the section reads as saved without
    // throwing away what the admin typed.
    const markSaved = useCallback(() => setBaseline(serialized), [serialized]);

    return { dirty, markSaved };
}
