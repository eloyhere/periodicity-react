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
 * Reads the document-level motion override.
 * `data-motion="always"` makes the application ignore the operating-system preference; individual providers can still
 * request `reducedMotion="always"`.
 * @example
 * const forced: boolean = isMotionForced();
 * @returns True when the document opts into motion regardless of the media query.
 */
const isMotionForced: () => boolean = (): boolean =>
    typeof document !== "undefined" && document.documentElement.dataset.motion === "always";

/**
 * Subscribes to changes of the reduced-motion media query and the document override.
 * @param onStoreChange - Callback invoked when either source changes.
 * @example
 * const unsubscribe: () => void = subscribe(onChange);
 * @returns A function that removes the subscriptions.
 */
const subscribe: (onStoreChange: () => void) => () => void = (
    onStoreChange: () => void,
): (() => void) => {
    const query: MediaQueryList | null = getMediaQuery();
    const observer: MutationObserver | null =
        typeof MutationObserver === "undefined"
            ? null
            : new MutationObserver(onStoreChange);

    observer?.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-motion"],
    });

    if (query === null) {
        return (): void => {
            observer?.disconnect();
        };
    }

    if (typeof query.addEventListener === "function") {
        query.addEventListener("change", onStoreChange);
        return (): void => {
            query.removeEventListener("change", onStoreChange);
            observer?.disconnect();
        };
    }

    query.addListener(onStoreChange);
    return (): void => {
        query.removeListener(onStoreChange);
        observer?.disconnect();
    };
};

/**
 * Reads the current reduced-motion preference.
 * @example
 * const reduced: boolean = getSnapshot();
 * @returns True when the operating system requests reduced motion and the document has not overridden it.
 */
const getSnapshot: () => boolean = (): boolean =>
    !isMotionForced() && (getMediaQuery()?.matches ?? false);

/**
 * Reads the server-side reduced-motion preference.
 * @example
 * const reduced: boolean = getServerSnapshot();
 * @returns Always false, because no media query exists during server rendering.
 */
const getServerSnapshot: () => boolean = (): boolean => false;

/**
 * Tracks the operating-system reduced-motion preference unless the document opts into motion.
 * @example
 * const reduced: boolean = usePrefersReducedMotion();
 * @returns True when the user prefers reduced motion and the document has not overridden it.
 */
export const usePrefersReducedMotion: () => boolean = (): boolean =>
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
