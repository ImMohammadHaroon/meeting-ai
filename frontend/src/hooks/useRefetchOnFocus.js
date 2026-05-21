import { useEffect } from 'react';

/**
 * Re-run callback when the tab becomes visible or the window regains focus.
 */
export function useRefetchOnFocus(callback, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const refetch = () => callback();

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refetch();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('focus', refetch);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('focus', refetch);
        };
    }, [callback, enabled]);
}
