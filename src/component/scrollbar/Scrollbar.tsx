/* eslint-disable react-hooks/refs -- thumb dragging needs the live viewport and pointer capture. */
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type FocusEventHandler,
    type HTMLAttributes,
    type PointerEvent as ReactPointerEvent,
    type PointerEventHandler,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type SetStateAction,
    type UIEvent,
    type UIEventHandler,
} from "react";
import cx from "../foundation/cx";
import useMergedRef from "../foundation/useMergedRef";
import "./Scrollbar.css";

/**
 * Scroll axis supported by the Scrollbar.
 * Type: type alias.
 * Fields: none.
 * @example
 * const orientation: ScrollbarOrientation = "vertical";
 */
export type ScrollbarOrientation = "vertical" | "horizontal" | "both";

interface ScrollbarAxisMetrics {
    visible: boolean;
    thumbSize: number;
    offset: number;
}

interface ScrollbarStyle extends CSSProperties {
    "--scrollbar-thickness": string;
    "--scrollbar-thumb-size": string;
    "--scrollbar-thumb-offset": string;
}

/**
 * Live scroll state passed to a custom scrollbar slot.
 * Type: interface.
 * Fields: vertical, horizontal, visible, dragging.
 * @example
 * const slot = (state: ScrollbarState) => <MyBar {...state} />;
 */
export interface ScrollbarState {
    vertical: ScrollbarAxisMetrics;
    horizontal: ScrollbarAxisMetrics;
    visible: boolean;
    dragging: "vertical" | "horizontal" | null;
}

/**
 * Replaceable scrollbar UI.
 * Type: interface.
 * Fields: scrollbar.
 * @example
 * <Scroll slots={{ scrollbar: (state) => <MyScrollbar state={state} /> }} />
 */
export interface ScrollbarSlots {
    scrollbar?: (state: ScrollbarState) => ReactNode;
}

/**
 * Native attributes for the internal scroll viewport.
 * Type: interface.
 * Fields: every div attribute except `children` and `onScroll`, plus data attributes.
 * @example
 * <Scroll viewportProps={{ tabIndex: 0, "aria-label": "Message history" }} />
 */
export interface ScrollbarViewportProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onScroll"> {
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Props for the overlay scrollbar.
 * Type: interface.
 * Fields: children, orientation, direction, autoHide, thickness, size,
 * minThumbSize, height, width, slots, viewportClassName, viewportProps, viewportRef,
 * className, onScroll, ref, plus native root attributes and events.
 * Scroll events are observed on the internal scroll viewport.
 * @example
 * <Scroll orientation="vertical" autoHide data-testid="scroll-region">
 *     <LongContent />
 * </Scroll>
 */
export interface ScrollbarProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onScroll"> {
    children: ReactNode;
    orientation?: ScrollbarOrientation;
    direction?: ScrollbarOrientation;
    autoHide?: boolean;
    thickness?: number;
    size?: number;
    minThumbSize?: number;
    height?: CSSProperties["height"];
    width?: CSSProperties["width"];
    slots?: ScrollbarSlots;
    viewportClassName?: string;
    viewportProps?: ScrollbarViewportProps;
    viewportRef?: Ref<HTMLDivElement>;
    className?: string;
    onScroll?: (event: UIEvent<HTMLDivElement>) => void;
    ref?: Ref<HTMLDivElement>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

const emptyAxis: ScrollbarAxisMetrics = { visible: false, thumbSize: 0, offset: 0 };

/**
 * Renders a native scroll viewport with Material overlay scrollbars.
 * @param props - Content, orientation, visibility, slot UI, sizing, and native attributes.
 * @example
 * <Scrollbar><div>Scrollable content</div></Scrollbar>
 * @returns A scroll viewport with custom thumbs and forwarded root and viewport refs.
 */
const Scrollbar: FC<ScrollbarProps> = ({
    children,
    orientation = "vertical",
    direction,
    autoHide = true,
    thickness = 6,
    size,
    minThumbSize = 24,
    height,
    width,
    slots,
    viewportClassName = "",
    viewportProps,
    viewportRef,
    className = "",
    onScroll,
    ref,
    style,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    ...rest
}: ScrollbarProps) => {
    const viewportNodeRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const contentRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const mergedViewportRef: RefCallback<HTMLDivElement> = useMergedRef(viewportRef, viewportNodeRef);
    const [vertical, setVertical]: [
        ScrollbarAxisMetrics,
        Dispatch<SetStateAction<ScrollbarAxisMetrics>>,
    ] = useState<ScrollbarAxisMetrics>(emptyAxis);
    const [horizontal, setHorizontal]: [
        ScrollbarAxisMetrics,
        Dispatch<SetStateAction<ScrollbarAxisMetrics>>,
    ] = useState<ScrollbarAxisMetrics>(emptyAxis);
    const [visible, setVisible]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(!autoHide);
    const [dragging, setDragging]: [
        "vertical" | "horizontal" | null,
        Dispatch<SetStateAction<"vertical" | "horizontal" | null>>,
    ] = useState<"vertical" | "horizontal" | null>(null);
    const hideTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const dragRef: RefObject<{
        start: number;
        scroll: number;
        max: number;
    } | null> = useRef<{ start: number; scroll: number; max: number } | null>(null);

    const axis: (element: HTMLDivElement, horizontalAxis: boolean) => ScrollbarAxisMetrics = (
        element: HTMLDivElement,
        horizontalAxis: boolean,
    ): ScrollbarAxisMetrics => {
        const client: number = horizontalAxis ? element.clientWidth : element.clientHeight;
        const total: number = horizontalAxis ? element.scrollWidth : element.scrollHeight;
        const scroll: number = horizontalAxis ? element.scrollLeft : element.scrollTop;

        if (total <= client + 1) {
            return emptyAxis;
        }

        const size: number = Math.min(
            client,
            Math.max(minThumbSize, (client * client) / total),
        );
        const maxScroll: number = Math.max(1, total - client);
        const maxOffset: number = Math.max(0, client - size);

        return {
            visible: true,
            thumbSize: size,
            offset: (scroll / maxScroll) * maxOffset,
        };
    };

    const measure: () => void = useCallback((): void => {
        const viewport: HTMLDivElement | null = viewportNodeRef.current;

        if (viewport === null) {
            return;
        }

        setVertical(axis(viewport, false));
        setHorizontal(axis(viewport, true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minThumbSize]);

    useLayoutEffect((): (() => void) => {
        measure();

        const viewport: HTMLDivElement | null = viewportNodeRef.current;
        const content: HTMLDivElement | null = contentRef.current;

        if (viewport === null) {
            return (): void => {};
        }

        const observer: ResizeObserver | null =
            typeof ResizeObserver === "undefined"
                ? null
                : new ResizeObserver(measure);
        observer?.observe(viewport);

        if (content !== null) {
            observer?.observe(content);
        }

        window.addEventListener("resize", measure);

        return (): void => {
            observer?.disconnect();
            window.removeEventListener("resize", measure);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minThumbSize]);

    useEffect(
        (): (() => void) => (): void => {
            if (hideTimerRef.current !== null) {
                window.clearTimeout(hideTimerRef.current);
            }
        },
        [],
    );

    const reveal: () => void = (): void => {
        setVisible(true);

        if (hideTimerRef.current !== null) {
            window.clearTimeout(hideTimerRef.current);
        }

        if (!autoHide || dragging !== null) {
            return;
        }

        hideTimerRef.current = window.setTimeout((): void => {
            setVisible(false);
        }, 900);
    };

    const hide: () => void = (): void => {
        if (!autoHide || dragging !== null) {
            return;
        }

        setVisible(false);
    };

    const handlePointerEnter: PointerEventHandler<HTMLDivElement> = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        reveal();
        onPointerEnter?.(event);
    };

    const handlePointerLeave: PointerEventHandler<HTMLDivElement> = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        hide();
        onPointerLeave?.(event);
    };

    const handleFocus: FocusEventHandler<HTMLDivElement> = (
        event: Parameters<FocusEventHandler<HTMLDivElement>>[0],
    ): void => {
        reveal();
        onFocus?.(event);
    };

    const handleBlur: FocusEventHandler<HTMLDivElement> = (
        event: Parameters<FocusEventHandler<HTMLDivElement>>[0],
    ): void => {
        hide();
        onBlur?.(event);
    };

    const handleViewportScroll: UIEventHandler<HTMLDivElement> = (
        event: UIEvent<HTMLDivElement>,
    ): void => {
        measure();
        reveal();
        onScroll?.(event);
    };

    const beginDrag: (
        axisName: "vertical" | "horizontal",
    ) => (event: ReactPointerEvent<HTMLDivElement>) => void = (
        axisName: "vertical" | "horizontal",
    ) => (event: ReactPointerEvent<HTMLDivElement>): void => {
        const viewport: HTMLDivElement | null = viewportNodeRef.current;

        if (viewport === null) {
            return;
        }

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(axisName);
        setVisible(true);
        dragRef.current = {
            start: axisName === "vertical" ? event.clientY : event.clientX,
            scroll: axisName === "vertical" ? viewport.scrollTop : viewport.scrollLeft,
            max:
                axisName === "vertical"
                    ? viewport.clientHeight - vertical.thumbSize
                    : viewport.clientWidth - horizontal.thumbSize,
        };
    };

    const moveDrag: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        const viewport: HTMLDivElement | null = viewportNodeRef.current;
        const drag: { start: number; scroll: number; max: number } | null = dragRef.current;

        if (viewport === null || drag === null || dragging === null) {
            return;
        }

        const position: number = dragging === "vertical" ? event.clientY : event.clientX;
        const ratio: number = drag.max <= 0 ? 0 : (position - drag.start) / drag.max;
        const total: number =
            dragging === "vertical"
                ? viewport.scrollHeight - viewport.clientHeight
                : viewport.scrollWidth - viewport.clientWidth;

        if (dragging === "vertical") {
            viewport.scrollTop = drag.scroll + ratio * total;
        } else {
            viewport.scrollLeft = drag.scroll + ratio * total;
        }
    };

    const endDrag: () => void = (): void => {
        dragRef.current = null;
        setDragging(null);
        reveal();
    };

    const trackDown: (
        axisName: "vertical" | "horizontal",
    ) => (event: ReactPointerEvent<HTMLDivElement>) => void = (
        axisName: "vertical" | "horizontal",
    ) => (event: ReactPointerEvent<HTMLDivElement>): void => {
        if (event.target !== event.currentTarget) {
            return;
        }

        const viewport: HTMLDivElement | null = viewportNodeRef.current;

        if (viewport === null) {
            return;
        }

        const rect: DOMRect = event.currentTarget.getBoundingClientRect();
        const position: number =
            axisName === "vertical"
                ? event.clientY - rect.top
                : event.clientX - rect.left;
        const size: number = axisName === "vertical" ? rect.height : rect.width;

        if (axisName === "vertical") {
            viewport.scrollTop =
                (position / Math.max(1, size)) * viewport.scrollHeight - viewport.clientHeight / 2;
        } else {
            viewport.scrollLeft =
                (position / Math.max(1, size)) * viewport.scrollWidth - viewport.clientWidth / 2;
        }

        reveal();
    };

    const resolvedOrientation: ScrollbarOrientation = direction ?? orientation;
    const resolvedSize: number = size ?? thickness;
    const showVertical: boolean =
        resolvedOrientation === "vertical" || resolvedOrientation === "both";
    const showHorizontal: boolean =
        resolvedOrientation === "horizontal" || resolvedOrientation === "both";
    const slotState: ScrollbarState = {
        vertical,
        horizontal,
        visible,
        dragging,
    };
    const rootStyle: CSSProperties = { ...(style ?? {}) };

    if (height !== (void 0)) {
        rootStyle.height = height;
    }

    if (width !== (void 0)) {
        rootStyle.width = width;
    }

    const verticalStyle: ScrollbarStyle = {
        "--scrollbar-thickness": `${resolvedSize}px`,
        "--scrollbar-thumb-size": `${vertical.thumbSize}px`,
        "--scrollbar-thumb-offset": `${vertical.offset}px`,
    };
    const horizontalStyle: ScrollbarStyle = {
        "--scrollbar-thickness": `${resolvedSize}px`,
        "--scrollbar-thumb-size": `${horizontal.thumbSize}px`,
        "--scrollbar-thumb-offset": `${horizontal.offset}px`,
    };

    return (
        <div
            {...rest}
            ref={ref}
            className={cx(
                "scrollbar",
                autoHide && "scrollbar--auto-hide",
                visible && "scrollbar--visible",
                dragging !== null && "scrollbar--dragging",
                className,
            )}
            data-orientation={resolvedOrientation}
            style={rootStyle}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            <div
                {...(viewportProps ?? {})}
                ref={mergedViewportRef}
                className={cx(
                    "scrollbar__viewport",
                    viewportClassName,
                    viewportProps?.className ?? "",
                )}
                onScroll={handleViewportScroll}
            >
                <div ref={contentRef} className="scrollbar__content">
                    {children}
                </div>
            </div>

            {slots?.scrollbar === (void 0) ? (
                <>
                    {showVertical && vertical.visible ? (
                        <div
                            className="scrollbar__track scrollbar__track--vertical"
                            style={verticalStyle}
                            aria-hidden="true"
                            onPointerDown={trackDown("vertical")}
                        >
                            <div
                                className="scrollbar__thumb"
                                onPointerDown={beginDrag("vertical")}
                                onPointerMove={moveDrag}
                                onPointerUp={endDrag}
                                onPointerCancel={endDrag}
                            />
                        </div>
                    ) : null}

                    {showHorizontal && horizontal.visible ? (
                        <div
                            className="scrollbar__track scrollbar__track--horizontal"
                            style={horizontalStyle}
                            aria-hidden="true"
                            onPointerDown={trackDown("horizontal")}
                        >
                            <div
                                className="scrollbar__thumb"
                                onPointerDown={beginDrag("horizontal")}
                                onPointerMove={moveDrag}
                                onPointerUp={endDrag}
                                onPointerCancel={endDrag}
                            />
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="scrollbar__slot">{slots.scrollbar(slotState)}</div>
            )}
        </div>
    );
};

/**
 * Public Scroll alias with the custom scrollbar slot.
 * @example
 * <Scroll slots={{ scrollbar: (state) => <MyScrollbar state={state} /> }} />
 */
export const Scroll: FC<ScrollbarProps> = Scrollbar;

export type ScrollProps = ScrollbarProps;

export default Scrollbar;
