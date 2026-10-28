import {
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type RefObject,
    type SetStateAction,
} from "react";
import {
    measureAnchorRect,
    observeAnchor,
    type AnchorRect,
} from "../anchor/useAnchorRect";

/**
 * Placement of a floating layer relative to its anchor.
 * Type: type alias.
 * Fields: none.
 * @example
 * const placement: Placement = "bottom-start";
 */
export type Placement =
    | "top"
    | "top-start"
    | "top-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "left"
    | "right";

/**
 * Main side of a placement.
 * Type: type alias.
 * Fields: none.
 * @example
 * const side: PlacementSide = "bottom";
 */
type PlacementSide = "top" | "bottom" | "left" | "right";

/**
 * Options for anchored positioning.
 * Type: interface.
 * Fields: placement, offset, padding, matchWidth, constrainHeight.
 * @example
 * useAnchoredPosition(anchorRef, floatingRef, { placement: "bottom-start" });
 */
export interface AnchoredPositionOptions {
    placement?: Placement;
    offset?: number;
    padding?: number;
    matchWidth?: boolean;
    /**
     * Caps the floating height to the space on the resolved side. Dropdown and
     * select panels opt in so they scroll inside the viewport instead of
     * clamping over their trigger when the viewport becomes short.
     */
    constrainHeight?: boolean;
}

/**
 * Style returned by the anchored position hook.
 * Type: interface.
 * Fields: native CSS properties plus the anchor size variables.
 * @example
 * const style: AnchoredStyle = anchored.style;
 */
export interface AnchoredStyle extends CSSProperties {
    "--anchor-max-height"?: string;
    "--anchor-max-width"?: string;
}

/**
 * Result of anchored positioning.
 * Type: interface.
 * Fields: style, placement, visible, maxHeight, maxWidth, update.
 * @example
 * const { style, visible } = useAnchoredPosition(anchorRef, floatingRef);
 */
export interface AnchoredPositionResult {
    style: AnchoredStyle;
    placement: Placement;
    visible: boolean;
    maxHeight: number | null;
    maxWidth: number | null;
    update: () => void;
}

/**
 * Internal anchored position.
 * Type: interface.
 * Fields: top, left, placement, width, height limits, visibility.
 * @example
 * const position: Position = { top: 0, left: 0, placement: "bottom-start", width: (void 0) };
 */
interface Position {
    top: number;
    left: number;
    placement: Placement;
    width: number | void;
    maxHeight: number | null;
    maxWidth: number | null;
    visible: boolean;
}

const initialPosition: Position = {
    top: 0,
    left: 0,
    placement: "bottom-start",
    width: (void 0),
    maxHeight: null,
    maxWidth: null,
    visible: false,
};

/**
 * Checks whether two positions are identical.
 * @param first - Previous position.
 * @param second - Next position.
 * @example
 * if (!isSamePosition(previous, next)) setPosition(next);
 * @returns True when both positions match.
 */
const isSamePosition: (first: Position, second: Position) => boolean = (
    first: Position,
    second: Position,
): boolean =>
    first.top === second.top &&
    first.left === second.left &&
    first.placement === second.placement &&
    first.width === second.width &&
    first.maxHeight === second.maxHeight &&
    first.maxWidth === second.maxWidth &&
    first.visible === second.visible;

/**
 * Flips a placement to the opposite side.
 * @param placement - Original placement.
 * @example
 * const flipped = oppositeSide("bottom-start");
 * @returns The flipped placement.
 */
const oppositeSide: (placement: Placement) => Placement = (placement: Placement): Placement => {
    if (placement.startsWith("bottom")) {
        return placement.replace("bottom", "top") as Placement;
    }

    if (placement.startsWith("top")) {
        return placement.replace("top", "bottom") as Placement;
    }

    if (placement.startsWith("left")) {
        return placement.replace("left", "right") as Placement;
    }

    if (placement.startsWith("right")) {
        return placement.replace("right", "left") as Placement;
    }

    return placement;
};

/**
 * Applies the measured position directly to the floating node.
 *
 * React state still renders the same values, but writing the styles before the
 * next frame keeps a scrolling panel glued to its trigger even if React is a
 * frame behind. Only `top` and `left` are written; the panel keeps ownership of
 * its `transform`, so open/close scale animations are not interrupted.
 * @param node - Floating layer.
 * @param position - Resolved position.
 * @example
 * applyPosition(panel, position);
 */
const applyPosition: (node: HTMLElement, position: Position) => void = (
    node: HTMLElement,
    position: Position,
): void => {
    node.style.top = `${position.top}px`;
    node.style.left = `${position.left}px`;
    node.style.visibility = position.visible ? "visible" : "hidden";

    if (position.maxHeight === null) {
        node.style.removeProperty("--anchor-max-height");
    } else {
        node.style.setProperty("--anchor-max-height", `${position.maxHeight}px`);
    }

    node.style.setProperty("--anchor-max-width", `${position.maxWidth ?? 0}px`);
};

/**
 * Anchors a floating layer to its trigger, flipping and clamping inside the
 * visual viewport.
 *
 * The shared anchor tracker measures the target every frame, so scrolling,
 * visual-viewport changes, layout transitions, and resizes all keep the layer
 * attached. When the target leaves the visual viewport the layer becomes
 * invisible instead of remaining clamped at a stale edge.
 * @param anchorRef - Anchor ref.
 * @param floatingRef - Floating layer ref.
 * @param options - Placement, offset, padding, width matching, and height constraint.
 * @example
 * const { style } = useAnchoredPosition(anchorRef, floatingRef, { placement: "bottom-start" });
 * @returns Position style, resolved placement, visibility, size limits, and a manual update function.
 */
export const useAnchoredPosition: (
    anchorRef: RefObject<HTMLElement | null>,
    floatingRef: RefObject<HTMLElement | null>,
    options?: AnchoredPositionOptions,
) => AnchoredPositionResult = (
    anchorRef: RefObject<HTMLElement | null>,
    floatingRef: RefObject<HTMLElement | null>,
    {
        placement = "bottom-start",
        offset = 8,
        padding = 12,
        matchWidth = false,
        constrainHeight = false,
    }: AnchoredPositionOptions = {},
): AnchoredPositionResult => {
    const [position, setPosition]: [Position, Dispatch<SetStateAction<Position>>] =
        useState<Position>(initialPosition);
    const anchorRectRef: RefObject<AnchorRect | null> = useRef<AnchorRect | null>(null);

    const compute: (anchorRect: AnchorRect | null) => void = useCallback(
        (anchorRect: AnchorRect | null): void => {
            const floating: HTMLElement | null = floatingRef.current;

            if (anchorRect === null || !anchorRect.visible || floating === null) {
                if (floating !== null) {
                    floating.style.visibility = "hidden";
                }

                setPosition(
                    (previous: Position): Position =>
                        previous.visible ? { ...previous, visible: false } : previous,
                );
                return;
            }

            const floatingRect: DOMRect = floating.getBoundingClientRect();
            const width: number =
                floatingRect.width > 0 ? floatingRect.width : floating.offsetWidth;
            const height: number =
                floatingRect.height > 0 ? floatingRect.height : floating.offsetHeight;
            const viewportWidth: number = anchorRect.viewportWidth;
            const viewportHeight: number = anchorRect.viewportHeight;
            const viewportLeft: number = anchorRect.viewportLeft;
            const viewportTop: number = anchorRect.viewportTop;
            const spaceBelow: number =
                viewportTop + viewportHeight - anchorRect.bottom - padding;
            const spaceAbove: number = anchorRect.top - viewportTop - padding;
            const spaceRight: number = viewportLeft + viewportWidth - anchorRect.right - padding;
            const spaceLeft: number = anchorRect.left - viewportLeft - padding;
            let resolvedPlacement: Placement = placement;

            if (
                placement.startsWith("bottom") &&
                spaceBelow < height + offset &&
                spaceAbove > spaceBelow
            ) {
                resolvedPlacement = oppositeSide(placement);
            } else if (
                placement.startsWith("top") &&
                spaceAbove < height + offset &&
                spaceBelow > spaceAbove
            ) {
                resolvedPlacement = oppositeSide(placement);
            } else if (
                placement.startsWith("right") &&
                spaceRight < width + offset &&
                spaceLeft > spaceRight
            ) {
                resolvedPlacement = oppositeSide(placement);
            } else if (
                placement.startsWith("left") &&
                spaceLeft < width + offset &&
                spaceRight > spaceLeft
            ) {
                resolvedPlacement = oppositeSide(placement);
            }

            const segments: string[] = resolvedPlacement.split("-");
            const side: PlacementSide = segments[0] as PlacementSide;
            const align: string = segments.length > 1 ? segments[1] : "";
            const maxHeight: number | null = constrainHeight
                ? Math.max(
                      0,
                      Math.floor(
                          side === "top"
                              ? spaceAbove - offset
                              : side === "bottom"
                                ? spaceBelow - offset
                                : viewportHeight - padding * 2,
                      ),
                  )
                : null;
            const maxWidth: number = Math.max(
                0,
                Math.floor(
                    side === "left"
                        ? spaceLeft - offset
                        : side === "right"
                          ? spaceRight - offset
                          : viewportWidth - padding * 2,
                ),
            );
            const effectiveHeight: number =
                maxHeight === null ? height : Math.min(height, maxHeight);
            const effectiveWidth: number = Math.min(width, maxWidth);
            const alignedLeft: number =
                align === "start"
                    ? anchorRect.left
                    : align === "end"
                      ? anchorRect.right - effectiveWidth
                      : anchorRect.left + anchorRect.width / 2 - effectiveWidth / 2;
            const centeredTop: number =
                anchorRect.top + anchorRect.height / 2 - effectiveHeight / 2;
            let top: number;
            let left: number;

            if (side === "bottom") {
                top = anchorRect.bottom + offset;
                left = alignedLeft;
            } else if (side === "top") {
                top = anchorRect.top - effectiveHeight - offset;
                left = alignedLeft;
            } else if (side === "left") {
                top = centeredTop;
                left = anchorRect.left - effectiveWidth - offset;
            } else {
                top = centeredTop;
                left = anchorRect.right + offset;
            }

            const minLeft: number = viewportLeft + padding;
            const minTop: number = viewportTop + padding;
            const maxLeft: number = Math.max(
                minLeft,
                viewportLeft + viewportWidth - effectiveWidth - padding,
            );
            const maxTop: number = Math.max(
                minTop,
                viewportTop + viewportHeight - effectiveHeight - padding,
            );
            const nextPosition: Position = {
                top: Math.min(Math.max(top, minTop), maxTop),
                left: Math.min(Math.max(left, minLeft), maxLeft),
                placement: resolvedPlacement,
                width: matchWidth ? Math.min(anchorRect.width, maxWidth) : (void 0),
                maxHeight,
                maxWidth,
                visible: true,
            };

            applyPosition(floating, nextPosition);
            setPosition((previous: Position): Position =>
                isSamePosition(previous, nextPosition) ? previous : nextPosition,
            );
        },
        [constrainHeight, floatingRef, matchWidth, offset, padding, placement],
    );

    const update: () => void = useCallback((): void => {
        const rect: AnchorRect | null = measureAnchorRect(anchorRef);
        anchorRectRef.current = rect;
        compute(rect);
    }, [anchorRef, compute]);

    useLayoutEffect((): (() => void) => {
        return observeAnchor(anchorRef, (rect: AnchorRect | null): void => {
            anchorRectRef.current = rect;
            compute(rect);
        });
    }, [anchorRef, compute]);

    useLayoutEffect((): (() => void) | void => {
        const node: HTMLElement | null = floatingRef.current;

        if (node === null) {
            return;
        }

        // The floating node mounts after the hook's first layout pass (a portalled
        // dropdown, for example), so position it again as soon as it exists.
        if (anchorRectRef.current !== null) {
            compute(anchorRectRef.current);
        }

        if (typeof ResizeObserver === "undefined") {
            return;
        }

        const observer: ResizeObserver = new ResizeObserver((): void => {
            if (anchorRectRef.current !== null) {
                compute(anchorRectRef.current);
            }
        });
        observer.observe(node);

        return (): void => {
            observer.disconnect();
        };
    });

    const style: AnchoredStyle = {
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: position.width === (void 0) ? (void 0) : `${position.width}px`,
        zIndex: "var(--z-dropdown)",
        visibility: position.visible ? "visible" : "hidden",
        "--anchor-max-height":
            position.maxHeight === null ? (void 0) : `${position.maxHeight}px`,
        "--anchor-max-width":
            position.maxWidth === null ? (void 0) : `${position.maxWidth}px`,
    };

    return {
        style,
        placement: position.placement,
        visible: position.visible,
        maxHeight: position.maxHeight,
        maxWidth: position.maxWidth,
        update,
    };
};

export default useAnchoredPosition;
