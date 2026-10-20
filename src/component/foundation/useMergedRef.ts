import {
    useCallback,
    useEffect,
    useRef,
    type MutableRefObject,
    type Ref,
    type RefCallback,
} from "react";

/**
 * Merges the React 19 ref prop with local refs into a stable callback.
 * @param refs - Refs to merge.
 * @example
 * <input ref={useMergedRef(innerRef, ref)} />
 * @returns A merged ref callback.
 */
export const useMergedRef: <T>(...refs: readonly (Ref<T> | void)[]) => RefCallback<T> = <T>(
    ...refs: readonly (Ref<T> | void)[]
): RefCallback<T> => {
    const refsRef: MutableRefObject<readonly (Ref<T> | void)[]> = useRef<
        readonly (Ref<T> | void)[]
    >(refs);

    useEffect((): void => {
        refsRef.current = refs;
    });

    return useCallback((node: T | null): void => {
        refsRef.current.forEach((ref: Ref<T> | void): void => {
            if (typeof ref === "function") {
                ref(node);
                return;
            }

            if (ref !== null && ref !== (void 0)) {
                (ref as MutableRefObject<T | null>).current = node;
            }
        });
    }, []);
};

export default useMergedRef;
