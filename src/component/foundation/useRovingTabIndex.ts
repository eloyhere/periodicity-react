import { useCallback, type KeyboardEvent, type KeyboardEventHandler } from "react";

/**
 * Arrow-key orientation for roving focus.
 * Type: type alias.
 * Fields: none.
 * @example
 * const orientation: RovingOrientation = "horizontal";
 */
export type RovingOrientation = "horizontal" | "vertical" | "both";

/**
 * Options for roving tabindex.
 * Type: interface.
 * Fields: count, activeIndex, onChange, orientation, loop.
 * @example
 * useRovingTabIndex({ count: 3, activeIndex: 0, onChange: setActive });
 */
export interface RovingTabIndexOptions {
    count: number;
    activeIndex: number;
    onChange: (index: number) => void;
    orientation?: RovingOrientation;
    loop?: boolean;
}

/**
 * Result of roving tabindex.
 * Type: interface.
 * Fields: tabIndexFor, onKeyDown.
 * @example
 * const { tabIndexFor, onKeyDown } = useRovingTabIndex(options);
 */
export interface RovingTabIndexResult {
    tabIndexFor: (index: number) => 0 | -1;
    onKeyDown: KeyboardEventHandler<HTMLElement>;
}
/**
 * Implements a single tab stop with arrow-key movement for lists and menus.
 * @param options - Item count, active index, change handler, orientation, and loop flag.
 * @example
 * const roving = useRovingTabIndex({ count: 3, activeIndex: 0, onChange: setActive });
 * @returns A tabIndex resolver and a keydown handler.
 */
export const useRovingTabIndex: (options: RovingTabIndexOptions) => RovingTabIndexResult = ({
    count,
    activeIndex,
    onChange,
    orientation = "horizontal",
    loop = true,
}: RovingTabIndexOptions): RovingTabIndexResult => {
    const onKeyDown: KeyboardEventHandler<HTMLElement> = useCallback(
        (event: KeyboardEvent<HTMLElement>): void => {
            const horizontal: boolean = orientation === "horizontal" || orientation === "both";
            const vertical: boolean = orientation === "vertical" || orientation === "both";
            let nextIndex: number | void = (void 0);

            if (event.key === "ArrowRight" && horizontal) {
                nextIndex = activeIndex + 1;
            } else if (event.key === "ArrowLeft" && horizontal) {
                nextIndex = activeIndex - 1;
            } else if (event.key === "ArrowDown" && vertical) {
                nextIndex = activeIndex + 1;
            } else if (event.key === "ArrowUp" && vertical) {
                nextIndex = activeIndex - 1;
            } else if (event.key === "Home") {
                nextIndex = 0;
            } else if (event.key === "End") {
                nextIndex = count - 1;
            }

            if (nextIndex === (void 0) || count <= 0) {
                return;
            }

            event.preventDefault();

            const bounded: number = loop
                ? ((nextIndex % count) + count) % count
                : Math.min(Math.max(nextIndex, 0), count - 1);

            if (bounded !== activeIndex) {
                onChange(bounded);
            }
        },
        [activeIndex, count, loop, onChange, orientation],
    );

    const tabIndexFor: (index: number) => 0 | -1 = useCallback(
        (index: number): 0 | -1 => (index === activeIndex && count > 0 ? 0 : -1),
        [activeIndex, count],
    );

    return { tabIndexFor, onKeyDown };
};

export default useRovingTabIndex;
