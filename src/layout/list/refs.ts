import type { MutableRefObject, Ref, RefCallback } from "react";

/**
 * Composes several refs into one callback ref and honours React 19 ref cleanups.
 *
 * A callback ref may return a cleanup function, and React only runs that cleanup while the returned
 * value is honoured. Virtual viewports rely on it to disconnect their resize observer, so the
 * composed callback keeps every returned cleanup and releases it before the next attach.
 * @param refs - Refs to compose; `(void 0)` and `null` entries are ignored.
 * @example
 * const mergedRef = useMemo(
 *     () => composeRefs<HTMLDivElement>([attachViewport, ref]),
 *     [attachViewport, ref],
 * );
 * @returns A callback ref that attaches and detaches every supplied ref.
 */
export const composeRefs: <T>(refs: readonly (Ref<T> | void)[]) => RefCallback<T> = <T>(
    refs: readonly (Ref<T> | void)[],
): RefCallback<T> => {
    let cleanups: (() => void)[] = [];

    return (node: T | null): void => {
        for (const cleanup of cleanups) {
            cleanup();
        }

        cleanups = [];

        for (const ref of refs) {
            if (typeof ref === "function") {
                const cleanup: void | (() => void) = ref(node);

                if (cleanup !== (void 0)) {
                    cleanups.push(cleanup);
                }

                continue;
            }

            if (ref !== null && ref !== (void 0)) {
                (ref as MutableRefObject<T | null>).current = node;
            }
        }
    };
};

export default composeRefs;
