import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";

/**
 * Options for dismiss-on-outside-pointer behaviour.
 * Type: interface.
 * Fields: enabled, refs, onDismiss, escape, outsidePointer, windowBlur, visibility.
 * @example
 * useDismiss({ refs: [panelRef], onDismiss: close });
 */
export interface DismissOptions {
    enabled?: boolean;
    refs: readonly RefObject<HTMLElement | null>[];
    onDismiss: () => void;
    escape?: boolean;
    outsidePointer?: boolean;
    /** Also dismiss when the browser window loses focus; defaults to `true`. */
    windowBlur?: boolean;
    /** Also dismiss when the document becomes hidden; defaults to `true`. */
    visibility?: boolean;
}
/**
 * Closes a floating layer on an outside pointer press, Escape, a window blur,
 * or the document being hidden.
 * @param options - Enable flag, inside refs, dismiss handler, and event switches.
 * @example
 * useDismiss({ refs: [panelRef], onDismiss: () => setOpen(false) });
 * @returns Nothing.
 */
export const useDismiss: (options: DismissOptions) => void = ({
    enabled = true,
    refs,
    onDismiss,
    escape = true,
    outsidePointer = true,
    windowBlur = true,
    visibility = true,
}: DismissOptions): void => {
    const refsRef: MutableRefObject<readonly RefObject<HTMLElement | null>[]> = useRef<
        readonly RefObject<HTMLElement | null>[]
    >(refs);
    const onDismissRef: MutableRefObject<() => void> = useRef<() => void>(onDismiss);

    useEffect((): void => {
        refsRef.current = refs;
        onDismissRef.current = onDismiss;
    });

    useEffect((): (() => void) | void => {
        if (!enabled) {
            return;
        }

        const handlePointerDown: (event: PointerEvent) => void = (event: PointerEvent): void => {
            if (!outsidePointer) {
                return;
            }

            const target: EventTarget | null = event.target;

            if (!(target instanceof Node)) {
                return;
            }

            const isInside: boolean = refsRef.current.some(
                (ref: RefObject<HTMLElement | null>): boolean =>
                    ref.current !== null && ref.current.contains(target),
            );

            if (!isInside) {
                onDismissRef.current();
            }
        };

        const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
            if (escape && event.key === "Escape") {
                event.stopPropagation();
                onDismissRef.current();
            }
        };

        const handleWindowBlur: () => void = (): void => {
            onDismissRef.current();
        };

        const handleVisibilityChange: () => void = (): void => {
            if (document.visibilityState === "hidden") {
                onDismissRef.current();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown, true);
        document.addEventListener("keydown", handleKeyDown);

        if (windowBlur) {
            window.addEventListener("blur", handleWindowBlur);
        }

        if (visibility) {
            document.addEventListener("visibilitychange", handleVisibilityChange);
        }

        return (): void => {
            document.removeEventListener("pointerdown", handlePointerDown, true);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("blur", handleWindowBlur);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [enabled, escape, outsidePointer, visibility, windowBlur]);
};

export default useDismiss;
