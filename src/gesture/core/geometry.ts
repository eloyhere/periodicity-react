/**
 * Point in CSS pixels.
 * Type: interface.
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @example
 * const point: GesturePoint = { x: 10, y: 20 };
 */
export interface GesturePoint {
    readonly x: number;
    readonly y: number;
}

/**
 * Rect in CSS pixels.
 * Type: interface.
 * @param left - Left edge.
 * @param top - Top edge.
 * @param right - Right edge.
 * @param bottom - Bottom edge.
 * @param width - Width.
 * @param height - Height.
 * @example
 * const rect: GestureRect = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 };
 */
export interface GestureRect {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly width: number;
    readonly height: number;
}

/**
 * Reads an element rectangle without retaining the live DOMRect.
 * @param element - Element to measure.
 * @example
 * const rect: GestureRect = readElementRect(button);
 * @returns A plain rectangle snapshot.
 */
export const readElementRect: (element: Element) => GestureRect = (element: Element): GestureRect => {
    const rect: DOMRect = element.getBoundingClientRect();

    return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
    };
};

/**
 * Returns the Euclidean distance between two points.
 * @param first - First point.
 * @param second - Second point.
 * @example
 * const distance: number = distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 });
 * @returns The distance in CSS pixels.
 */
export const distanceBetween: (first: GesturePoint, second: GesturePoint) => number = (
    first: GesturePoint,
    second: GesturePoint,
): number => Math.hypot(second.x - first.x, second.y - first.y);

/**
 * Whether a point lies inside a rectangle, inclusive of its edges.
 * @param point - Point to test.
 * @param rect - Rectangle to test against.
 * @example
 * const inside: boolean = isPointInRect({ x: 10, y: 10 }, rect);
 * @returns True when the point is inside.
 */
export const isPointInRect: (point: GesturePoint, rect: GestureRect) => boolean = (
    point: GesturePoint,
    rect: GestureRect,
): boolean =>
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;

/**
 * Returns the centre point of a rectangle.
 * @param rect - Rectangle to inspect.
 * @example
 * const centre: GesturePoint = getRectCentre(rect);
 * @returns The centre in CSS pixels.
 */
export const getRectCentre: (rect: GestureRect) => GesturePoint = (rect: GestureRect): GesturePoint => ({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
});
