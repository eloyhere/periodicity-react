import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";

/**
 * Options for the focus trap.
 * Type: interface.
 * Fields: onEscape, returnFocus.
 * @example
 * useFocusTrap(panelRef, open, { onEscape: close });
 */
export interface FocusTrapOptions {
    onEscape?: () => void;
    returnFocus?: boolean;
}

const FocusableSelector: string = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "summary",
    "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Collects visible, focusable elements inside a container.
 * @param container - Container element.
 * @example
 * const items = getFocusable(panel);
 * @returns The focusable elements.
 */
const getFocusable: (container: HTMLElement) => HTMLElement[] = (
    container: HTMLElement,
): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FocusableSelector)).filter(
        (node: HTMLElement): boolean =>
            node.getClientRects().length > 0 && !node.hasAttribute("inert"),
    );
/**
 * Keeps Tab focus inside a container and restores focus on close.
 * @param ref - Container ref.
 * @param active - Whether the trap is active.
 * @param options - Escape handler and focus restoration flag.
 * @example
 * useFocusTrap(panelRef, open, { onEscape: close });
 * @returns Nothing.
 */
export const useFocusTrap: (
    ref: RefObject<HTMLElement | null>,
    active: boolean,
    options?: FocusTrapOptions,
) => void = (
    ref: RefObject<HTMLElement | null>,
    active: boolean,
    { onEscape, returnFocus = true }: FocusTrapOptions = {},
): void => {
    const onEscapeRef: MutableRefObject<(() => void) | void> = useRef<(() => void) | void>(onEscape);

    useEffect((): void => {
        onEscapeRef.current = onEscape;
    });

    useEffect((): (() => void) | void => {
        if (!active) {
            return;
        }

        const container: HTMLElement | null = ref.current;

        if (container === null) {
            return;
        }

        const previousActive: HTMLElement | null =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;

        if (!container.contains(document.activeElement)) {
            const focusable: HTMLElement[] = getFocusable(container);

            if (focusable.length > 0) {
                focusable[0].focus({ preventScroll: true });
            } else {
                container.focus({ preventScroll: true });
            }
        }

        const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                onEscapeRef.current?.();
                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            const focusable: HTMLElement[] = getFocusable(container);

            if (focusable.length === 0) {
                event.preventDefault();
                container.focus({ preventScroll: true });
                return;
            }

            const first: HTMLElement = focusable[0];
            const last: HTMLElement = focusable[focusable.length - 1];
            const current: Element | null = document.activeElement;
            const isOutside: boolean = current === null || !container.contains(current);

            if (event.shiftKey) {
                if (isOutside || current === first) {
                    event.preventDefault();
                    last.focus({ preventScroll: true });
                }

                return;
            }

            if (isOutside || current === last) {
                event.preventDefault();
                first.focus({ preventScroll: true });
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);

        return (): void => {
            document.removeEventListener("keydown", handleKeyDown, true);

            if (returnFocus && previousActive !== null && previousActive.isConnected) {
                previousActive.focus({ preventScroll: true });
            }
        };
    }, [active, ref, returnFocus]);
};

export default useFocusTrap;
