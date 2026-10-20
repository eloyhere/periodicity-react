import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useState,
    type CSSProperties,
    type Dispatch,
    type RefObject,
    type SetStateAction,
} from "react";

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
 * Fields: placement, offset, padding, matchWidth.
 * @example
 * useAnchoredPosition(anchorRef, floatingRef, { placement: "bottom-start" });
 */
export interface AnchoredPositionOptions {
    placement?: Placement;
    offset?: number;
    padding?: number;
    matchWidth?: boolean;
}

/**
 * Result of anchored positioning.
 * Type: interface.
 * Fields: style, placement, update.
 * @example
 * const { style } = useAnchoredPosition(anchorRef, floatingRef);
 */
export interface AnchoredPositionResult {
    style: CSSProperties;
    placement: Placement;
    update: () => void;
}

/**
 * Internal anchored position.
 * Type: interface.
 * Fields: top, left, placement, width.
 * @example
 * const position: Position = { top: 0, left: 0, placement: "bottom-start", width: (void 0) };
 */
interface Position {
    top: number;
    left: number;
    placement: Placement;
    width: number | void;
}

const initialPosition: Position = {
    top: 0,
    left: 0,
    placement: "bottom-start",
    width: (void 0),
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
    first.width === second.width;

/**
 * Flips a vertical placement to the opposite side.
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

    return placement;
};
/**
 * Anchors a floating layer to its trigger, flipping and clamping inside the viewport.
 * @param anchorRef - Anchor ref.
 * @param floatingRef - Floating layer ref.
 * @param options - Placement, offset, padding, and width matching.
 * @example
 * const { style } = useAnchoredPosition(anchorRef, floatingRef, { placement: "bottom-start" });
 * @returns Position style, resolved placement, and a manual update function.
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
    }: AnchoredPositionOptions = {},
): AnchoredPositionResult => {
    const [position, setPosition]: [Position, Dispatch<SetStateAction<Position>>] =
        useState<Position>(initialPosition);

    const update: () => void = useCallback((): void => {
        const anchor: HTMLElement | null = anchorRef.current;
        const floating: HTMLElement | null = floatingRef.current;

        if (anchor === null || floating === null) {
            return;
        }

        const anchorRect: DOMRect = anchor.getBoundingClientRect();
        const floatingRect: DOMRect = floating.getBoundingClientRect();
        const width: number = floatingRect.width > 0 ? floatingRect.width : floating.offsetWidth;
        const height: number = floatingRect.height > 0 ? floatingRect.height : floating.offsetHeight;
        const viewportWidth: number = window.innerWidth;
        const viewportHeight: number = window.innerHeight;
        const spaceBelow: number = viewportHeight - anchorRect.bottom - padding;
        const spaceAbove: number = anchorRect.top - padding;
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
        }

        const segments: string[] = resolvedPlacement.split("-");
        const side: PlacementSide = segments[0] as PlacementSide;
        const align: string = segments.length > 1 ? segments[1] : "";
        const alignedLeft: number =
            align === "start"
                ? anchorRect.left
                : align === "end"
                  ? anchorRect.right - width
                  : anchorRect.left + anchorRect.width / 2 - width / 2;
        const centeredTop: number = anchorRect.top + anchorRect.height / 2 - height / 2;
        let top: number;
        let left: number;

        if (side === "bottom") {
            top = anchorRect.bottom + offset;
            left = alignedLeft;
        } else if (side === "top") {
            top = anchorRect.top - height - offset;
            left = alignedLeft;
        } else if (side === "left") {
            top = centeredTop;
            left = anchorRect.left - width - offset;
        } else {
            top = centeredTop;
            left = anchorRect.right + offset;
        }

        const maxLeft: number = Math.max(padding, viewportWidth - width - padding);
        const maxTop: number = Math.max(padding, viewportHeight - height - padding);
        const nextPosition: Position = {
            top: Math.min(Math.max(top, padding), maxTop),
            left: Math.min(Math.max(left, padding), maxLeft),
            placement: resolvedPlacement,
            width: matchWidth ? anchorRect.width : (void 0),
        };

        setPosition((previous: Position): Position =>
            isSamePosition(previous, nextPosition) ? previous : nextPosition,
        );
    }, [anchorRef, floatingRef, matchWidth, offset, padding, placement]);

    useLayoutEffect((): (() => void) | void => {
        update();

        const node: HTMLElement | null = floatingRef.current;

        if (node === null) {
            return;
        }

        const resizeObserver: ResizeObserver | null =
            typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
        resizeObserver?.observe(node);

        window.addEventListener("resize", update);

        return (): void => {
            resizeObserver?.disconnect();
            window.removeEventListener("resize", update);
        };
    }, [floatingRef, update]);

    useEffect((): (() => void) => {
        window.addEventListener("scroll", update, true);

        return (): void => {
            window.removeEventListener("scroll", update, true);
        };
    }, [update]);

    useEffect((): (() => void) => {
        // Run after every render: the floating panel mounts later than the hook,
        // so the layout effect above can see a null ref on the first pass.
        const handle: number = window.requestAnimationFrame(update);

        return (): void => {
            window.cancelAnimationFrame(handle);
        };
    });

    useLayoutEffect((): void => {
        // Position before paint when the panel has just mounted, avoiding a flash
        // at the initial (0, 0) coordinates.
        update();
    });

    const style: CSSProperties = {
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: position.width === (void 0) ? (void 0) : `${position.width}px`,
        zIndex: "var(--z-dropdown)",
    };

    return { style, placement: position.placement, update };
};

export default useAnchoredPosition;
