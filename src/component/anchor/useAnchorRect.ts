import {
    useLayoutEffect,
    useState,
    type Dispatch,
    type RefObject,
    type SetStateAction,
} from "react";

/**
 * Anything that can identify the element a floating layer is anchored to.
 * Type: type alias.
 * Fields: a React ref, a live element, a selector string, or null.
 * @example
 * const target: AnchorTarget = triggerRef;
 */
export type AnchorTarget = RefObject<HTMLElement | null> | HTMLElement | string | null;

/**
 * Viewport-space geometry of an anchor.
 * Type: interface.
 * Fields: bounds, visibility, and the visual viewport used to measure it.
 * @example
 * const anchor: AnchorRect = measureAnchorRect(triggerRef)!;
 */
export interface AnchorRect {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    visible: boolean;
    viewportTop: number;
    viewportLeft: number;
    viewportWidth: number;
    viewportHeight: number;
}

/**
 * Resolves an anchor target to its current element.
 * @param target - Ref, element, selector, or null.
 * @example
 * const element: HTMLElement | null = resolveAnchorTarget("#panel");
 * @returns The current element, or null when it is not mounted.
 */
export const resolveAnchorTarget: (target: AnchorTarget) => HTMLElement | null = (
    target: AnchorTarget,
): HTMLElement | null => {
    if (target === null || target === (void 0)) {
        return null;
    }

    if (typeof target === "string") {
        return typeof document === "undefined" ? null : document.querySelector<HTMLElement>(target);
    }

    if (typeof HTMLElement !== "undefined" && target instanceof HTMLElement) {
        return target;
    }

    return (target as RefObject<HTMLElement | null>).current;
};

/**
 * Visual viewport bounds in layout coordinates.
 * Type: interface.
 * Fields: top, left, width, height.
 * @example
 * const bounds: VisualViewportBounds = readVisualViewport();
 */
interface VisualViewportBounds {
    top: number;
    left: number;
    width: number;
    height: number;
}

/**
 * Reads the visual viewport. Pinch zoom and the mobile keyboard change these
 * values without changing the layout viewport, so floating layers must clamp to
 * this rectangle rather than `window.innerWidth` / `innerHeight`.
 * @example
 * const viewport = readVisualViewport();
 * @returns Visual viewport bounds in layout coordinates.
 */
const readVisualViewport: () => VisualViewportBounds = (): VisualViewportBounds => {
    if (typeof window === "undefined") {
        return { top: 0, left: 0, width: 0, height: 0 };
    }

    const viewport: VisualViewport | null = window.visualViewport ?? null;

    return {
        top: viewport?.offsetTop ?? 0,
        left: viewport?.offsetLeft ?? 0,
        width: viewport?.width ?? window.innerWidth,
        height: viewport?.height ?? window.innerHeight,
    };
};

/**
 * Measures an anchor in viewport coordinates.
 * @param target - Ref, element, or selector to measure.
 * @example
 * const rect = measureAnchorRect(triggerRef);
 * @returns Geometry including whether the anchor intersects the visual viewport.
 */
export const measureAnchorRect: (target: AnchorTarget) => AnchorRect | null = (
    target: AnchorTarget,
): AnchorRect | null => {
    const node: HTMLElement | null = resolveAnchorTarget(target);

    if (node === null || typeof node.getBoundingClientRect !== "function") {
        return null;
    }

    const bounds: DOMRect = node.getBoundingClientRect();
    const viewport: VisualViewportBounds = readVisualViewport();
    const hasSize: boolean = bounds.width > 0 && bounds.height > 0;
    const intersects: boolean =
        bounds.bottom > viewport.top &&
        bounds.top < viewport.top + viewport.height &&
        bounds.right > viewport.left &&
        bounds.left < viewport.left + viewport.width;
    const visible: boolean = !hasSize || intersects;

    return {
        top: bounds.top,
        left: bounds.left,
        right: bounds.right,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
        visible,
        viewportTop: viewport.top,
        viewportLeft: viewport.left,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
    };
};

/**
 * Compares two anchor measurements without allocating a formatted signature.
 * @param first - Previous measurement.
 * @param second - Next measurement.
 * @example
 * if (!isSameAnchor(first, second)) onChange(second);
 * @returns True when every measured field matches.
 */
const isSameAnchor: (first: AnchorRect | null, second: AnchorRect | null) => boolean = (
    first: AnchorRect | null,
    second: AnchorRect | null,
): boolean => {
    if (first === null || second === null) {
        return first === second;
    }

    return (
        first.top === second.top &&
        first.left === second.left &&
        first.right === second.right &&
        first.bottom === second.bottom &&
        first.width === second.width &&
        first.height === second.height &&
        first.visible === second.visible &&
        first.viewportTop === second.viewportTop &&
        first.viewportLeft === second.viewportLeft &&
        first.viewportWidth === second.viewportWidth &&
        first.viewportHeight === second.viewportHeight
    );
};

/**
 * Subscribes to one anchor's viewport rectangle.
 *
 * The anchor is measured once per animation frame while the returned tracker is
 * mounted. That single loop covers scrolling, visual-viewport changes, layout
 * shifts, and transitions that move the target without firing a scroll or resize
 * event. `ResizeObserver` and immediate scroll listeners are used only to reduce
 * latency; the frame loop remains the source of truth.
 * @param target - Ref, element, or selector to track.
 * @param onChange - Called whenever the measured rectangle changes.
 * @example
 * const stop = observeAnchor(triggerRef, (rect) => position(rect));
 * @returns A cleanup function.
 */
export const observeAnchor: (
    target: AnchorTarget,
    onChange: (rect: AnchorRect | null) => void,
) => () => void = (target: AnchorTarget, onChange: (rect: AnchorRect | null) => void): (() => void) => {
    if (typeof window === "undefined") {
        return (): void => (void 0);
    }

    let frame: number = 0;
    let disposed: boolean = false;
    let last: AnchorRect | null = null;
    let hasMeasurement: boolean = false;
    let observedNode: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const viewport: VisualViewport | null = window.visualViewport ?? null;
    let publish: () => void = (): void => (void 0);

    const onChangeEvent: () => void = (): void => {
        publish();
    };

    publish = (): void => {
        if (disposed) {
            return;
        }

        const node: HTMLElement | null = resolveAnchorTarget(target);

        if (node !== observedNode) {
            resizeObserver?.disconnect();
            resizeObserver =
                typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onChangeEvent);
            if (node !== null) {
                resizeObserver?.observe(node);
            }
            observedNode = node;
        }

        const next: AnchorRect | null = measureAnchorRect(target);

        if (!hasMeasurement || !isSameAnchor(last, next)) {
            hasMeasurement = true;
            last = next;
            onChange(next);
        }
    };

    const track: () => void = (): void => {
        if (disposed) {
            return;
        }

        publish();
        frame = window.requestAnimationFrame(track);
    };

    publish();
    frame = window.requestAnimationFrame(track);
    window.addEventListener("scroll", onChangeEvent, true);
    window.addEventListener("resize", onChangeEvent);
    viewport?.addEventListener("resize", onChangeEvent);
    viewport?.addEventListener("scroll", onChangeEvent);

    return (): void => {
        disposed = true;
        window.cancelAnimationFrame(frame);
        window.removeEventListener("scroll", onChangeEvent, true);
        window.removeEventListener("resize", onChangeEvent);
        viewport?.removeEventListener("resize", onChangeEvent);
        viewport?.removeEventListener("scroll", onChangeEvent);
        resizeObserver?.disconnect();
    };
};

/**
 * Tracks an anchor for the lifetime of a component.
 * @param target - Ref, element, or selector to track.
 * @param enabled - Skips tracking while false.
 * @example
 * const rect = useAnchorRect(targetRef, loading);
 * @returns The latest measurement, or null while the target is unavailable.
 */
export const useAnchorRect: (
    target: AnchorTarget,
    enabled?: boolean,
) => AnchorRect | null = (target: AnchorTarget, enabled: boolean = true): AnchorRect | null => {
    const [rect, setRect]: [
        AnchorRect | null,
        Dispatch<SetStateAction<AnchorRect | null>>,
    ] = useState<AnchorRect | null>(null);

    useLayoutEffect((): (() => void) | void => {
        if (!enabled) {
            return;
        }

        return observeAnchor(target, setRect);
    }, [enabled, target]);

    return rect;
};

export default useAnchorRect;
