/**
 * Returns a cleanup callback for the mobile navigation.
 *
 * Closing the mobile sheet can leave `pointer-events` pinned on `body`, which
 * silently blocks every subsequent click on the page; the callback removes that
 * inline style and is called after each in-menu navigation.
 */
import { useCallback } from 'react';

export function useMobileNavigation() {
    return useCallback(() => {
        // Remove pointer-events style from body...
        document.body.style.removeProperty('pointer-events');
    }, []);
}
