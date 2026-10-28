/* eslint-disable react-hooks/refs -- thumb dragging needs the live viewport and pointer capture. */
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type FocusEventHandler,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type KeyboardEventHandler,
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
import { useInternational, type InternationalContextValue } from "../../international";
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

/**
 * Keyboard target mode for the scrollbar.
 * Type: type alias.
 * Fields: "viewport" focuses the native overflow container; "thumb" focuses each
 * visible custom thumb as a separate scrollbar widget.
 * @example
 * const target: ScrollbarKeyboardTarget = "thumb";
 */
export type ScrollbarKeyboardTarget = "viewport" | "thumb";

/**
 * Scroll axis used by keyboard navigation and measured geometry.
 * Type: type alias.
 * Fields: "vertical" and "horizontal".
 * @example
 * const axis: ScrollbarAxisName = "vertical";
 */
type ScrollbarAxisName = "vertical" | "horizontal";

interface ScrollbarAxisMetrics {
    visible: boolean;
    thumbSize: number;
    offset: number;
    /** Maximum scrollable distance; omitted by caller-built slot state. */
    maxScroll?: number;
    /** Current scroll position; omitted by caller-built slot state. */
    scroll?: number;
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
 * Each axis carries its visibility, thumb size, thumb offset, maximum scroll,
 * and current scroll position for ARIA value reporting.
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
 * When `keyboardTarget` is `"thumb"`, the slot wrapper becomes the focusable
 * `role="scrollbar"` widget, so slot content should remain decorative.
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
 * The viewport receives `tabIndex={0}` automatically while it is the keyboard
 * target and scrolling is possible; an explicit `tabIndex` is always preserved.
 * @example
 * <Scroll viewportProps={{ role: "region", "aria-label": "Message history" }} />
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
 * keyboardTarget, scrollbarLabel, className, onScroll, onKeyDown, ref, plus native
 * root attributes and events.
 * Scroll events are observed on the internal scroll viewport. A caller `onKeyDown`
 * runs before the internal scroll keys and can cancel them with `preventDefault()`.
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
    /**
     * Keyboard target that owns the scrollbar tab stop.
     * Defaults to `"viewport"`. Use `"thumb"` when a custom-drawn thumb should be
     * the focus target; with both axes each visible thumb is a separate widget.
     * The viewport then leaves the tab order unless its `viewportProps.tabIndex`
     * is supplied explicitly.
     * @example
     * keyboardTarget="thumb"
     */
    keyboardTarget?: ScrollbarKeyboardTarget;
    /**
     * Accessible label for the scrollbar thumb or custom scrollbar slot.
     * Defaults to "Vertical scrollbar", "Horizontal scrollbar", or "Scrollbar".
     * @example
     * scrollbarLabel="Message history scrollbar"
     */
    scrollbarLabel?: string;
    className?: string;
    onScroll?: (event: UIEvent<HTMLDivElement>) => void;
    ref?: Ref<HTMLDivElement>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

const emptyAxis: ScrollbarAxisMetrics = {
    visible: false,
    thumbSize: 0,
    offset: 0,
    maxScroll: 0,
    scroll: 0,
};

/**
 * Pixels travelled by one arrow-key press.
 * Type: number constant.
 * @example
 * const lineStep = KeyboardLineStep;
 */
const KeyboardLineStep: number = 40;

/**
 * Fraction of the visible extent travelled by page keys and Space.
 * Type: number constant.
 * @example
 * const pageStep = Math.round(viewport.clientHeight * KeyboardPageRatio);
 */
const KeyboardPageRatio: number = 0.9;

/**
 * Renders a native scroll viewport with Material overlay scrollbars.
 * @param props - Content, orientation, visibility, keyboard target, slot UI, sizing,
 * and native attributes.
 * @example
 * <Scrollbar><div>Scrollable content</div></Scrollbar>
 * @returns A scroll viewport with custom thumbs, ARIA values, and forwarded refs.
 */const Scrollbar: FC<ScrollbarProps> = ({
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
    keyboardTarget = "viewport",
    scrollbarLabel,
    className = "",
    onScroll,
    onKeyDown,
    ref,
    style,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    ...rest
}: ScrollbarProps) => {
    const { t }: InternationalContextValue = useInternational();
    const generatedId: string = useId();
    const viewportId: string = viewportProps?.id ?? `scrollbar-viewport${generatedId}`;
    const rootNodeRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const viewportNodeRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const contentRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const mergedRootRef: RefCallback<HTMLDivElement> = useMergedRef(ref, rootNodeRef);
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
            maxScroll,
            scroll: Math.min(maxScroll, Math.max(0, scroll)),
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

    const hasScrollTargetFocus: () => boolean = (): boolean => {
        const root: HTMLDivElement | null = rootNodeRef.current;
        const active: Element | null = document.activeElement;

        if (root === null || active === null || !root.contains(active)) {
            return false;
        }

        return active instanceof HTMLElement && active.dataset.scrollbarKeyboard !== (void 0);
    };

    const reveal: () => void = (): void => {
        setVisible(true);

        if (hideTimerRef.current !== null) {
            window.clearTimeout(hideTimerRef.current);
        }

        if (!autoHide || dragging !== null || hasScrollTargetFocus()) {
            return;
        }

        hideTimerRef.current = window.setTimeout((): void => {
            setVisible(false);
        }, 900);
    };

    const hide: () => void = (): void => {
        if (!autoHide || dragging !== null || hasScrollTargetFocus()) {
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
        const next: EventTarget | null = event.relatedTarget;

        if (next instanceof Node && event.currentTarget.contains(next)) {
            onBlur?.(event);
            return;
        }

        // Focus is leaving the scrollbar, so the auto-hide timer applies again.
        if (autoHide && dragging === null) {
            setVisible(false);
        }

        onBlur?.(event);
    };

    const handleViewportScroll: UIEventHandler<HTMLDivElement> = (
        event: UIEvent<HTMLDivElement>,
    ): void => {
        measure();
        reveal();
        onScroll?.(event);
    };

    const axisMax: (axisName: ScrollbarAxisName) => number = (
        axisName: ScrollbarAxisName,
    ): number => {
        const viewport: HTMLDivElement | null = viewportNodeRef.current;

        if (viewport === null) {
            return 0;
        }

        return axisName === "vertical"
            ? Math.max(0, viewport.scrollHeight - viewport.clientHeight)
            : Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    };

    const scrollAxisTo: (axisName: ScrollbarAxisName, position: number) => void = (
        axisName: ScrollbarAxisName,
        position: number,
    ): void => {
        const viewport: HTMLDivElement | null = viewportNodeRef.current;

        if (viewport === null) {
            return;
        }

        const next: number = Math.min(axisMax(axisName), Math.max(0, Math.round(position)));

        if (axisName === "vertical") {
            viewport.scrollTop = next;
        } else {
            viewport.scrollLeft = next;
        }
    };

    const scrollAxisBy: (axisName: ScrollbarAxisName, delta: number) => void = (
        axisName: ScrollbarAxisName,
        delta: number,
    ): void => {
        const viewport: HTMLDivElement | null = viewportNodeRef.current;

        if (viewport === null) {
            return;
        }

        const current: number =
            axisName === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
        scrollAxisTo(axisName, current + delta);
    };

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        onKeyDown?.(event);

        if (event.defaultPrevented || event.nativeEvent.isComposing) {
            return;
        }

        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        // Ignore keys raised by form controls and other focusable content.
        const target: EventTarget | null = event.target;

        if (!(target instanceof HTMLElement)) {
            return;
        }

        const zone: string | undefined = target.dataset.scrollbarKeyboard;

        if (zone === (void 0)) {
            return;
        }

        const viewport: HTMLDivElement | null = viewportNodeRef.current;

        if (viewport === null) {
            return;
        }

        const lockedAxis: ScrollbarAxisName | null =
            zone === "vertical" || zone === "horizontal" ? zone : null;
        const primaryAxis: ScrollbarAxisName | null =
            lockedAxis ??
            (vertical.visible ? "vertical" : horizontal.visible ? "horizontal" : null);

        if (primaryAxis === null) {
            return;
        }

        const extent: number =
            primaryAxis === "vertical" ? viewport.clientHeight : viewport.clientWidth;
        const pageStep: number = Math.max(1, Math.round(extent * KeyboardPageRatio));
        const key: string = event.key;

        if (
            key === "ArrowUp" ||
            key === "ArrowDown" ||
            key === "ArrowLeft" ||
            key === "ArrowRight"
        ) {
            const horizontalKey: boolean = key === "ArrowLeft" || key === "ArrowRight";

            if (lockedAxis !== null && (lockedAxis === "horizontal") !== horizontalKey) {
                return;
            }

            let targetAxis: ScrollbarAxisName;

            if (lockedAxis !== null) {
                targetAxis = lockedAxis;
            } else if (horizontalKey) {
                targetAxis = horizontal.visible ? "horizontal" : "vertical";
            } else {
                targetAxis = vertical.visible ? "vertical" : "horizontal";
            }

            const delta: number =
                key === "ArrowUp" || key === "ArrowLeft" ? -KeyboardLineStep : KeyboardLineStep;

            event.preventDefault();
            scrollAxisBy(targetAxis, delta);
            return;
        }

        if (key === "PageUp" || key === "PageDown") {
            event.preventDefault();
            scrollAxisBy(primaryAxis, key === "PageUp" ? -pageStep : pageStep);
            return;
        }

        if (key === "Home" || key === "End") {
            event.preventDefault();
            scrollAxisTo(primaryAxis, key === "Home" ? 0 : axisMax(primaryAxis));
            return;
        }

        if (key === " " || key === "Spacebar") {
            event.preventDefault();
            scrollAxisBy(primaryAxis, event.shiftKey ? -pageStep : pageStep);
        }
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
    const scrollable: boolean = vertical.visible || horizontal.visible;
    const thumbTarget: boolean = keyboardTarget === "thumb";
    const slotWidget: boolean = thumbTarget && scrollable;
    const viewportTabIndex: number =
        viewportProps?.tabIndex ??
        (keyboardTarget === "viewport" && scrollable ? 0 : -1);
    const verticalLabel: string = scrollbarLabel ?? t("verticalScrollbar");
    const horizontalLabel: string = scrollbarLabel ?? t("horizontalScrollbar");
    const slotLabel: string = scrollbarLabel ?? t("scrollbar");
    const slotAxisName: ScrollbarAxisName = vertical.visible ? "vertical" : "horizontal";
    const slotAxis: ScrollbarAxisMetrics = vertical.visible ? vertical : horizontal;
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
            ref={mergedRootRef}
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
            onKeyDown={handleKeyDown}
        >
            <div
                {...(viewportProps ?? {})}
                ref={mergedViewportRef}
                id={viewportId}
                className={cx(
                    "scrollbar__viewport",
                    viewportClassName,
                    viewportProps?.className ?? "",
                )}
                tabIndex={viewportTabIndex}
                data-scrollbar-keyboard="viewport"
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
                            onPointerDown={trackDown("vertical")}
                        >
                            <div
                                className="scrollbar__thumb"
                                role="scrollbar"
                                aria-orientation="vertical"
                                aria-valuemin={0}
                                aria-valuemax={Math.round(vertical.maxScroll ?? 0)}
                                aria-valuenow={Math.round(vertical.scroll ?? 0)}
                                aria-controls={viewportId}
                                aria-label={verticalLabel}
                                tabIndex={thumbTarget ? 0 : -1}
                                data-scrollbar-keyboard="vertical"
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
                            onPointerDown={trackDown("horizontal")}
                        >
                            <div
                                className="scrollbar__thumb"
                                role="scrollbar"
                                aria-orientation="horizontal"
                                aria-valuemin={0}
                                aria-valuemax={Math.round(horizontal.maxScroll ?? 0)}
                                aria-valuenow={Math.round(horizontal.scroll ?? 0)}
                                aria-controls={viewportId}
                                aria-label={horizontalLabel}
                                tabIndex={thumbTarget ? 0 : -1}
                                data-scrollbar-keyboard="horizontal"
                                onPointerDown={beginDrag("horizontal")}
                                onPointerMove={moveDrag}
                                onPointerUp={endDrag}
                                onPointerCancel={endDrag}
                            />
                        </div>
                    ) : null}
                </>
            ) : (
                <div
                    className="scrollbar__slot"
                    role={slotWidget ? "scrollbar" : (void 0)}
                    aria-orientation={slotWidget ? slotAxisName : (void 0)}
                    aria-valuemin={slotWidget ? 0 : (void 0)}
                    aria-valuemax={slotWidget ? Math.round(slotAxis.maxScroll ?? 0) : (void 0)}
                    aria-valuenow={slotWidget ? Math.round(slotAxis.scroll ?? 0) : (void 0)}
                    aria-controls={slotWidget ? viewportId : (void 0)}
                    aria-label={slotWidget ? slotLabel : (void 0)}
                    tabIndex={slotWidget ? 0 : (void 0)}
                    data-scrollbar-keyboard={slotWidget ? "slot" : (void 0)}
                >
                    {slots.scrollbar(slotState)}
                </div>
            )}
        </div>
    );
};

export default Scrollbar;
