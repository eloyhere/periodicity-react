import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type RefObject,
    type SetStateAction,
    type UIEvent,
} from "react";
import cx from "../../component/foundation/cx";
import Scrollbar from "../../component/scrollbar/Scrollbar";
import useMergedRef from "../../component/foundation/useMergedRef";
import { CoordinatorContext, type CoordinatorContextValue } from "./context";
import "./Coordinator.css";

/**
 * Wheel delta modes reported by the browser.
 * Type: const object.
 * @param pixel - Delta in CSS pixels.
 * @param line - Delta in text lines.
 * @param page - Delta in viewport pages.
 * @example
 * const lineMode = WheelDeltaMode.line;
 */
const WheelDeltaMode: {
    readonly pixel: number;
    readonly line: number;
    readonly page: number;
} = {
    pixel: 0,
    line: 1,
    page: 2,
} as const;

/**
 * Height of one text line used to convert line-mode wheel deltas.
 * Type: number constant.
 * @example
 * const pixels = event.deltaY * WheelLineHeight;
 */
const WheelLineHeight: number = 16;

/**
 * Sub-pixel tolerance used when reading scroll limits.
 * Type: number constant.
 * @example
 * const atEnd = viewport.scrollTop >= range - WheelScrollTolerance;
 */
const WheelScrollTolerance: number = 1;

/**
 * Converts one wheel event into vertical CSS pixels.
 * @param event - Native wheel event.
 * @param pageHeight - Viewport height used for page-mode deltas.
 * @example
 * const delta = wheelDelta(event, viewport.clientHeight);
 * @returns The vertical distance in CSS pixels.
 */
const wheelDelta: (event: WheelEvent, pageHeight: number) => number = (
    event: WheelEvent,
    pageHeight: number,
): number => {
    if (event.deltaMode === WheelDeltaMode.line) {
        return event.deltaY * WheelLineHeight;
    }

    if (event.deltaMode === WheelDeltaMode.page) {
        return event.deltaY * Math.max(1, pageHeight);
    }

    return event.deltaY;
};

/**
 * Reports whether a wheel gesture is a vertical scroll.
 * Trackpads report both axes, so the dominant axis decides; Shift turns the
 * wheel horizontal on most platforms and is left to the content.
 * @param event - Native wheel event.
 * @example
 * const vertical = isVerticalWheel(event);
 * @returns `true` when the gesture scrolls vertically.
 */
const isVerticalWheel: (event: WheelEvent) => boolean = (event: WheelEvent): boolean =>
    !event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX);

/**
 * Reports whether a scroll container can still move in a wheel direction.
 * @param element - Element that owns the scroll range.
 * @param delta - Vertical wheel distance; positive scrolls down.
 * @example
 * const scrollable = canScroll(viewport, 120);
 * @returns `true` when the container has range left in that direction.
 */
const canScroll: (element: HTMLElement, delta: number) => boolean = (
    element: HTMLElement,
    delta: number,
): boolean => {
    const range: number = element.scrollHeight - element.clientHeight;

    if (range <= WheelScrollTolerance) {
        return false;
    }

    return delta > 0
        ? element.scrollTop < range - WheelScrollTolerance
        : element.scrollTop > WheelScrollTolerance;
};

/**
 * Reports whether an element consumes vertical wheel input itself.
 * @param element - Element that may be a vertical scroll container.
 * @param delta - Vertical wheel distance; positive scrolls down.
 * @example
 * const consumes = canConsumeWheel(row, 40);
 * @returns `true` when the element is scrollable and has range left.
 */
const canConsumeWheel: (element: HTMLElement, delta: number) => boolean = (
    element: HTMLElement,
    delta: number,
): boolean => {
    const overflowY: string = window.getComputedStyle(element).overflowY;

    if (overflowY !== "auto" && overflowY !== "scroll" && overflowY !== "overlay") {
        return false;
    }

    return canScroll(element, delta);
};

/**
 * Reports whether the event target or one of its ancestors consumes a wheel.
 * @param target - Event target from the native wheel event.
 * @param boundary - Coordinator root where the ancestor walk stops.
 * @param delta - Vertical wheel distance; positive scrolls down.
 * @example
 * const consumed = wheelTargetCanScroll(event.target, root, 120);
 * @returns `true` when a nested scroll container owns the wheel input.
 */
const wheelTargetCanScroll: (
    target: EventTarget | null,
    boundary: HTMLElement,
    delta: number,
) => boolean = (
    target: EventTarget | null,
    boundary: HTMLElement,
    delta: number,
): boolean => {
    let node: Element | null = target instanceof Element ? target : null;

    while (node !== null && node !== boundary) {
        if (node instanceof HTMLElement && canConsumeWheel(node, delta)) {
            return true;
        }

        node = node.parentElement;
    }

    return false;
};

/**
 * Props for the Coordinator scroll host.
 * Type: interface.
 * Fields: collapse, header, main, collapseHeight, height, scrollRef, onScrollChange, className, ref, plus native div attributes.
 * @example
 * <Coordinator
 *     collapse={<Hero />}
 *     header={<Toolbar title="Explore" />}
 *     main={<p>Content</p>}
 *     height={520}
 * />
 */
export interface CoordinatorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    collapse?: ReactNode;
    header?: ReactNode;
    main: ReactNode;
    collapseHeight?: number;
    height?: number | string;
    scrollRef?: Ref<HTMLDivElement>;
    onScrollChange?: (offset: number, maxOffset: number) => void;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Hosts a collapsing area above a fixed header and one scrollable main slot.
 * While the main content can scroll, native scrolling shrinks the collapse area
 * and reports progress to the header. When it cannot scroll, the coordinator
 * takes vertical wheel input over from the content and collapses or restores
 * the area itself; horizontal and modified wheel gestures are left alone.
 * @param props - Collapse, header, main, heights, and native container attributes.
 * @example
 * <Coordinator
 *     collapse={<Hero />}
 *     header={<Toolbar title="Explore" />}
 *     main={<p>Scrollable content</p>}
 * />
 * @returns A coordinator layout with three slots.
 */
const Coordinator: FC<CoordinatorProps> = ({
    collapse,
    header,
    main,
    collapseHeight = 220,
    height = 520,
    scrollRef,
    onScrollChange,
    className = "",
    ref,
    onScroll,
    ...rest
}: CoordinatorProps) => {
    const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const viewportRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const mergedRootRef: Ref<HTMLDivElement> = useMergedRef<HTMLDivElement>(ref, rootRef);
    const mergedViewportRef: Ref<HTMLDivElement> = useMergedRef<HTMLDivElement>(
        scrollRef,
        viewportRef,
    );
    const [offset, setOffset]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(0);
    const [maxOffset, setMaxOffset]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(0);
    const [wheelOffset, setWheelOffset]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(0);
    const wheelOffsetRef: RefObject<number> = useRef<number>(0);
    const collapsible: boolean = collapse !== (void 0) && collapseHeight > 0;

    const measure: () => void = useCallback((): void => {
        const viewport: HTMLDivElement | null = viewportRef.current;

        if (viewport === null) {
            return;
        }

        setMaxOffset(Math.max(0, viewport.scrollHeight - viewport.clientHeight));
    }, []);

    useEffect((): (() => void) => {
        measure();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure);

            return (): void => window.removeEventListener("resize", measure);
        }

        const observer: ResizeObserver = new ResizeObserver(measure);
        const viewport: HTMLDivElement | null = viewportRef.current;

        if (viewport !== null) {
            observer.observe(viewport);
            if (viewport.firstElementChild !== null) {
                observer.observe(viewport.firstElementChild);
            }
        }

        return (): void => observer.disconnect();
    }, [measure]);

    useEffect((): (() => void) => {
        const root: HTMLDivElement | null = rootRef.current;

        if (root === null || !collapsible) {
            return (): void => {};
        }

        /**
         * Let the main viewport scroll natively while it has range; otherwise take the
         * vertical wheel over from the content and shrink or restore the collapse area.
         * The listener runs in the capture phase so a component that cannot scroll no
         * longer consumes the gesture first.
         * @param event - Native wheel event captured at the coordinator root.
         * @example
         * root.addEventListener("wheel", handleWheel, { capture: true, passive: false });
         * @returns Nothing.
         */
        const handleWheel: (event: WheelEvent) => void = (event: WheelEvent): void => {
            if (!isVerticalWheel(event) || event.defaultPrevented) {
                return;
            }

            if (event.ctrlKey || event.altKey || event.metaKey) {
                return;
            }

            const viewport: HTMLDivElement | null = viewportRef.current;

            if (viewport === null) {
                return;
            }

            const delta: number = wheelDelta(event, viewport.clientHeight);

            // Native scrolling keeps the collapse area and header in sync through onScroll.
            if (delta === 0 || canScroll(viewport, delta)) {
                return;
            }

            if (wheelTargetCanScroll(event.target, root, delta)) {
                return;
            }

            const previous: number = Math.min(wheelOffsetRef.current, collapseHeight);
            const next: number = Math.min(collapseHeight, Math.max(0, previous + delta));

            if (next === previous) {
                return;
            }

            wheelOffsetRef.current = next;
            setWheelOffset(next);
            event.preventDefault();
            event.stopPropagation();
        };

        root.addEventListener("wheel", handleWheel, { capture: true, passive: false });

        return (): void => {
            root.removeEventListener("wheel", handleWheel, { capture: true });
        };
    }, [collapseHeight, collapsible]);

    const scrollTo: (next: number, behavior?: ScrollBehavior) => void = useCallback(
        (next: number, behavior: ScrollBehavior = "smooth"): void => {
            viewportRef.current?.scrollTo({ top: next, behavior });
        },
        [],
    );

    const handleScroll: (event: UIEvent<HTMLDivElement>) => void = (
        event: UIEvent<HTMLDivElement>,
    ): void => {
        const viewport: HTMLDivElement = event.currentTarget;
        const next: number = Math.max(0, viewport.scrollTop);
        setOffset(next);
        setMaxOffset(Math.max(0, viewport.scrollHeight - viewport.clientHeight));
        onScrollChange?.(next, Math.max(0, viewport.scrollHeight - viewport.clientHeight));
        onScroll?.(event);
    };

    const style: CSSProperties = {
        height: typeof height === "number" ? `${height}px` : height,
    };

    const collapseOffset: number = offset + Math.min(wheelOffset, collapseHeight);
    const contextValue: CoordinatorContextValue = useMemo<CoordinatorContextValue>(
        () => ({ collapseOffset, maxOffset, offset, scrollTo }),
        [collapseOffset, maxOffset, offset, scrollTo],
    );
    const currentCollapseHeight: number = Math.max(0, collapseHeight - collapseOffset);

    return (
        <CoordinatorContext.Provider value={contextValue}>
            <div
                {...rest}
                ref={mergedRootRef}
                className={cx("coordinator", className)}
                style={{ ...style, ...rest.style }}
                data-offset={offset}
            >
                {collapse === (void 0) ? null : (
                    <div
                        className="coordinator__collapse"
                        style={{ height: `${currentCollapseHeight}px` }}
                        aria-hidden={currentCollapseHeight <= 0 ? "true" : (void 0)}
                        inert={currentCollapseHeight <= 0 ? true : (void 0)}
                    >
                        {collapse}
                    </div>
                )}
                {header === (void 0) ? null : (
                    <div className="coordinator__header">{header}</div>
                )}
                <Scrollbar
                    className="coordinator__scrollbar"
                    height="100%"
                    orientation="vertical"
                    autoHide={false}
                    viewportClassName="coordinator__viewport"
                    viewportRef={mergedViewportRef}
                    onScroll={handleScroll}
                    scrollbarLabel="Coordinator content"
                >
                    {main}
                </Scrollbar>
            </div>
        </CoordinatorContext.Provider>
    );
};

export default Coordinator;
