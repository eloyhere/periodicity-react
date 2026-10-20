import {
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
    type Dispatch,
    type RefCallback,
    type RefObject,
    type SetStateAction,
    type UIEvent,
} from "react";

/**
 * Alignment used when bringing a virtual row into view.
 * Type: type alias.
 * Fields: none.
 * @example
 * const align: VirtualScrollAlign = "nearest";
 */
export type VirtualScrollAlign = "start" | "center" | "end" | "nearest";

/**
 * Options for a fixed-row virtual window.
 * Type: interface.
 * Fields: count, itemHeight, fallbackHeight, overscan, resetKey.
 * @example
 * const options: VirtualWindowOptions = { count: 160, itemHeight: 40, fallbackHeight: 280 };
 */
export interface VirtualWindowOptions {
    count: number;
    itemHeight: number;
    fallbackHeight: number;
    overscan?: number;
    resetKey?: unknown;
}

/**
 * Scroll state and measured range of a fixed-row virtual window.
 * Type: interface.
 * Fields: viewportRef, attachViewport, attached, scrollTop, viewportHeight, start, end,
 * onScroll, scrollToIndex, scrollToBottom.
 * @example
 * const { attachViewport, start, end } = useVirtualWindow({ count, itemHeight, fallbackHeight });
 */
export interface VirtualWindow {
    viewportRef: RefObject<HTMLDivElement | null>;
    attachViewport: RefCallback<HTMLDivElement>;
    attached: boolean;
    scrollTop: number;
    viewportHeight: number;
    start: number;
    end: number;
    onScroll: (event: UIEvent<HTMLDivElement>) => void;
    scrollToIndex: (index: number, align?: VirtualScrollAlign) => void;
    scrollToBottom: () => void;
}

/**
 * Measures a scroll viewport and derives a clamped fixed-row window from it.
 *
 * The viewport height is measured with `ResizeObserver` the moment the element attaches, so the first
 * rendered slice already reflects the real box instead of the nominal `fallbackHeight`. Scroll offsets are
 * only written for explicit navigation requests; ordinary scrolling flows in one direction (element to
 * state), which keeps the window free of render/scroll feedback loops.
 * @param options - Row count, fixed row height, nominal height, overscan rows, and a resync key.
 * @example
 * const { attachViewport, start, end } = useVirtualWindow({
 *     count: options.length,
 *     itemHeight: 40,
 *     fallbackHeight: 280,
 *     overscan: 2,
 * });
 * @returns The measured window state used to render a complete visible slice.
 */
export const useVirtualWindow: (options: VirtualWindowOptions) => VirtualWindow = ({
    count,
    itemHeight,
    fallbackHeight,
    overscan = 2,
    resetKey = (void 0),
}: VirtualWindowOptions): VirtualWindow => {
    const viewportRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const [attached, setAttached]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [scrollTop, setScrollTop]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const [measuredHeight, setMeasuredHeight]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const rowHeight: number = Math.max(1, itemHeight);
    const nominalHeight: number = Math.max(0, fallbackHeight);
    const viewportHeight: number = measuredHeight > 0 ? measuredHeight : nominalHeight;
    const safeOverscan: number = Math.max(0, Math.floor(overscan));
    const maxScrollTop: number = Math.max(0, count * rowHeight - viewportHeight);
    const clampedScrollTop: number = Math.min(Math.max(0, scrollTop), maxScrollTop);
    const visibleRows: number = Math.ceil(viewportHeight / rowHeight) + safeOverscan * 2;
    const firstRow: number = Math.max(0, Math.floor(clampedScrollTop / rowHeight) - safeOverscan);
    const start: number = Math.min(Math.max(0, count - visibleRows), firstRow);
    const end: number = Math.min(count, start + visibleRows);

    /**
     * Attaches the scroll viewport, measures it, and mirrors its scroll offset into state.
     * @param node - Mounted scroll viewport, or `null` while detaching.
     * @example
     * <div ref={attachViewport} onScroll={onScroll} />
     * @returns A cleanup that releases the observer and the viewport ref.
     */
    const attachViewport: RefCallback<HTMLDivElement> = useCallback(
        (node: HTMLDivElement | null): (() => void) | void => {
            if (node === null) {
                viewportRef.current = null;
                setAttached(false);
                setScrollTop(0);
                return (void 0);
            }

            viewportRef.current = node;
            setAttached(true);

            const release: () => void = (): void => {
                if (viewportRef.current === node) {
                    viewportRef.current = null;
                    setAttached(false);
                    // The element is gone; the next mount starts at the top until navigation runs again.
                    setScrollTop(0);
                }
            };

            const measure: () => void = (): void => {
                const nextHeight: number = node.clientHeight;
                setMeasuredHeight((previousHeight: number): number =>
                    previousHeight === nextHeight ? previousHeight : nextHeight,
                );
            };

            measure();
            setScrollTop((previousTop: number): number =>
                previousTop === node.scrollTop ? previousTop : node.scrollTop,
            );

            if (typeof ResizeObserver === "undefined") {
                window.addEventListener("resize", measure);

                return (): void => {
                    window.removeEventListener("resize", measure);
                    release();
                };
            }

            const observer: ResizeObserver = new ResizeObserver(measure);
            observer.observe(node);

            return (): void => {
                observer.disconnect();
                release();
            };
        },
        [],
    );

    // A new data set can leave the previous offset beyond the shortened content; the browser clamps the
    // element, so mirror that clamped offset once instead of writing a scroll position during render.
    // `resetKey` covers content that is swapped out while the row count stays unchanged (loading states).
    useLayoutEffect((): void => {
        const node: HTMLDivElement | null = viewportRef.current;

        if (node === null) {
            return;
        }

        const nextTop: number = node.scrollTop;

        setScrollTop((previousTop: number): number =>
            previousTop === nextTop ? previousTop : nextTop,
        );
    }, [count, resetKey, rowHeight, viewportHeight]);

    /**
     * Scrolls the viewport so that one row is visible, clamped to the real scroll range.
     * @param index - Row index to reveal.
     * @param align - Placement of the row inside the viewport, defaulting to the nearest edge.
     * @example
     * scrollToIndex(120, "nearest");
     * @returns Nothing.
     */
    const scrollToIndex: (index: number, align?: VirtualScrollAlign) => void = useCallback(
        (index: number, align: VirtualScrollAlign = "nearest"): void => {
            const node: HTMLDivElement | null = viewportRef.current;

            if (node === null) {
                return;
            }

            const height: number = node.clientHeight > 0 ? node.clientHeight : viewportHeight;
            const contentHeight: number =
                node.scrollHeight > 0 ? node.scrollHeight : count * rowHeight;
            const maxTop: number = Math.max(0, contentHeight - height);
            const top: number = Math.min(Math.max(0, index), Math.max(0, count - 1)) * rowHeight;
            let nextTop: number = node.scrollTop;

            if (align === "start") {
                nextTop = top;
            } else if (align === "end") {
                nextTop = top + rowHeight - height;
            } else if (align === "center") {
                nextTop = top + rowHeight / 2 - height / 2;
            } else if (top < nextTop) {
                nextTop = top;
            } else if (top + rowHeight > nextTop + height) {
                nextTop = top + rowHeight - height;
            }

            nextTop = Math.min(Math.max(0, nextTop), maxTop);

            if (Math.abs(node.scrollTop - nextTop) > 0.5) {
                node.scrollTop = nextTop;
            }

            setScrollTop((previousTop: number): number =>
                previousTop === nextTop ? previousTop : nextTop,
            );
        },
        [count, rowHeight, viewportHeight],
    );

    /**
     * Pins the viewport to the end of its content.
     * @example
     * scrollToBottom();
     * @returns Nothing.
     */
    const scrollToBottom: () => void = useCallback((): void => {
        const node: HTMLDivElement | null = viewportRef.current;

        if (node === null) {
            return;
        }

        const nextTop: number = Math.max(0, node.scrollHeight - node.clientHeight);

        if (Math.abs(node.scrollTop - nextTop) > 0.5) {
            node.scrollTop = nextTop;
        }

        setScrollTop((previousTop: number): number =>
            previousTop === nextTop ? previousTop : nextTop,
        );
    }, []);

    /**
     * Mirrors a native scroll offset into state.
     * @param event - Scroll event from the viewport.
     * @example
     * <div onScroll={onScroll} />
     * @returns Nothing.
     */
    const onScroll: (event: UIEvent<HTMLDivElement>) => void = useCallback(
        (event: UIEvent<HTMLDivElement>): void => {
            const nextTop: number = event.currentTarget.scrollTop;

            setScrollTop((previousTop: number): number =>
                previousTop === nextTop ? previousTop : nextTop,
            );
        },
        [],
    );

    return {
        viewportRef,
        attachViewport,
        attached,
        scrollTop: clampedScrollTop,
        viewportHeight,
        start,
        end,
        onScroll,
        scrollToIndex,
        scrollToBottom,
    };
};

export default useVirtualWindow;
