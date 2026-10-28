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
 * Options for the waterfall scroll viewport.
 * Type: interface.
 * Fields: fallbackHeight, contentHeight.
 * @example
 * const options: WaterfallWindowOptions = { fallbackHeight: 480, contentHeight: 2400 };
 */
export interface WaterfallWindowOptions {
    fallbackHeight: number;
    contentHeight: number;
}

/**
 * Measured viewport state used to window a waterfall.
 * Type: interface.
 * Fields: viewportRef, attachViewport, scrollTop, viewportHeight, onScroll.
 * @example
 * const { attachViewport, scrollTop, viewportHeight } = useWaterfallWindow(options);
 */
export interface WaterfallWindow {
    viewportRef: RefObject<HTMLDivElement | null>;
    attachViewport: RefCallback<HTMLDivElement>;
    scrollTop: number;
    viewportHeight: number;
    onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

/**
 * Measures a waterfall scroll viewport and mirrors its scroll offset into state.
 *
 * The nominal height is used until the first measurement, so the initial render
 * already shows a useful slice. Content-height changes re-read the clamped
 * scroll offset once instead of writing a scroll position during render.
 * @param options - Nominal viewport height and current content height.
 * @example
 * const { attachViewport, scrollTop, viewportHeight } = useWaterfallWindow({
 *     fallbackHeight: 480,
 *     contentHeight: arrangement.height,
 * });
 * @returns The viewport ref, measurement, and scroll state.
 */
export const useWaterfallWindow: (options: WaterfallWindowOptions) => WaterfallWindow = ({
    fallbackHeight,
    contentHeight,
}: WaterfallWindowOptions): WaterfallWindow => {
    const viewportRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const [scrollTop, setScrollTop]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const [measuredHeight, setMeasuredHeight]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const viewportHeight: number =
        measuredHeight > 0 ? measuredHeight : Math.max(0, fallbackHeight);

    /**
     * Attaches the scroll viewport, measures it, and mirrors its scroll offset.
     * @param node - Mounted scroll viewport, or `null` while detaching.
     * @example
     * <div ref={attachViewport} onScroll={onScroll} />
     * @returns A cleanup that releases the observer and the viewport ref.
     */
    const attachViewport: RefCallback<HTMLDivElement> = useCallback(
        (node: HTMLDivElement | null): (() => void) | void => {
            if (node === null) {
                viewportRef.current = null;
                setMeasuredHeight(0);
                setScrollTop(0);
                return (void 0);
            }

            viewportRef.current = node;

            const release: () => void = (): void => {
                if (viewportRef.current === node) {
                    viewportRef.current = null;
                    setMeasuredHeight(0);
                    // The element is gone; the next mount starts at the top.
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

    // A shorter arrangement leaves the previous offset beyond the content; the browser clamps the
    // element, so mirror that clamped offset once instead of writing a scroll position during render.
    useLayoutEffect((): void => {
        const node: HTMLDivElement | null = viewportRef.current;

        if (node === null) {
            return;
        }

        const nextTop: number = node.scrollTop;

        setScrollTop((previousTop: number): number =>
            previousTop === nextTop ? previousTop : nextTop,
        );
    }, [contentHeight, fallbackHeight, viewportHeight]);

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
        scrollTop,
        viewportHeight,
        onScroll,
    };
};

export default useWaterfallWindow;
