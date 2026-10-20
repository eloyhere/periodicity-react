import { useSyncExternalStore } from "react";

const Query: string = "(prefers-reduced-motion: reduce)";

let mediaQuery: MediaQueryList | null = null;

/**
 * Lazily creates the reduced-motion media query.
 * @example
 * const query: MediaQueryList | null = getMediaQuery();
 * @returns The media query, or null when matchMedia is unavailable.
 */
const getMediaQuery: () => MediaQueryList | null = (): MediaQueryList | null => {
    if (mediaQuery !== null) {
        return mediaQuery;
    }

    if (typeof globalThis.matchMedia !== "function") {
        return null;
    }

    mediaQuery = globalThis.matchMedia(Query);
    return mediaQuery;
};

/**
 * Subscribes to changes of the reduced-motion media query.
 * @param onStoreChange - Callback invoked when the media query result changes.
 * @example
 * const unsubscribe: () => void = subscribe(onChange);
 * @returns A function that removes the subscription.
 */
const subscribe: (onStoreChange: () => void) => () => void = (
    onStoreChange: () => void,
): (() => void) => {
    const query: MediaQueryList | null = getMediaQuery();

    if (query === null) {
        return () => (void 0);
    }

    if (typeof query.addEventListener === "function") {
        query.addEventListener("change", onStoreChange);
        return () => {
            query.removeEventListener("change", onStoreChange);
        };
    }

    query.addListener(onStoreChange);
    return () => {
        query.removeListener(onStoreChange);
    };
};

/**
 * Reads the current reduced-motion preference.
 * @example
 * const reduced: boolean = getSnapshot();
 * @returns True when the operating system requests reduced motion.
 */
const getSnapshot: () => boolean = (): boolean => getMediaQuery()?.matches ?? false;

/**
 * Reads the server-side reduced-motion preference.
 * @example
 * const reduced: boolean = getServerSnapshot();
 * @returns Always false, because no media query exists during server rendering.
 */
const getServerSnapshot: () => boolean = (): boolean => false;

/**
 * Tracks the operating-system reduced-motion preference.
 * @example
 * const reduced: boolean = usePrefersReducedMotion();
 * @returns True when the user prefers reduced motion.
 */
export const usePrefersReducedMotion: () => boolean = (): boolean =>
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
