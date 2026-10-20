/**
 * Geometry of a ripple spawned from a pointer position.
 * Type: interface.
 * Fields: x, y (centre relative to the surface), size (diameter).
 * @example
 * const geometry: RippleGeometry = measureRipple(bounds, event.clientX, event.clientY);
 */
export interface RippleGeometry {
    x: number;
    y: number;
    size: number;
}

/**
 * Measures a ripple centred on the pointer, sized to reach the farthest corner.
 * @param bounds - Surface bounding rectangle.
 * @param clientX - Pointer X in viewport coordinates.
 * @param clientY - Pointer Y in viewport coordinates.
 * @example
 * const geometry: RippleGeometry = measureRipple(bounds, 120, 80);
 * @returns The centre and diameter of the ripple.
 */
export const measureRipple: (bounds: DOMRect, clientX: number, clientY: number) => RippleGeometry = (
    bounds: DOMRect,
    clientX: number,
    clientY: number,
): RippleGeometry => {
    const x: number = clientX - bounds.left;
    const y: number = clientY - bounds.top;
    const horizontal: number = Math.max(x, bounds.width - x);
    const vertical: number = Math.max(y, bounds.height - y);
    const radius: number = Math.hypot(horizontal, vertical);

    return { x, y, size: radius * 2 };
};

/**
 * Measures a ripple centred in the surface, used for keyboard activation.
 * @param bounds - Surface bounding rectangle.
 * @example
 * const geometry: RippleGeometry = measureCenteredRipple(bounds);
 * @returns The centre and diameter of the ripple.
 */
export const measureCenteredRipple: (bounds: DOMRect) => RippleGeometry = (
    bounds: DOMRect,
): RippleGeometry => {
    const x: number = bounds.width / 2;
    const y: number = bounds.height / 2;
    const radius: number = Math.hypot(x, y);

    return { x, y, size: radius * 2 };
};

/**
 * Parses a computed CSS colour into numeric channels.
 * @param value - Computed colour string.
 * @example
 * const channels = parseColour("rgba(0, 0, 0, 0.5)");
 * @returns Channels, or null when the value is not an rgb/rgba colour.
 */
const parseColour: (value: string) => readonly [number, number, number, number] | null = (
    value: string,
): readonly [number, number, number, number] | null => {
    const match: RegExpMatchArray | null = value.match(
        /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i,
    );

    if (match === null) {
        return null;
    }

    return [
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
        match[4] === (void 0) ? 1 : Number(match[4]),
    ];
};

/**
 * Computes relative luminance for an sRGB channel triple.
 * @param red - Red channel from zero to 255.
 * @param green - Green channel from zero to 255.
 * @param blue - Blue channel from zero to 255.
 * @example
 * const luminance = relativeLuminance(255, 255, 255);
 * @returns Relative luminance from zero to one.
 */
const relativeLuminance: (red: number, green: number, blue: number) => number = (
    red: number,
    green: number,
    blue: number,
): number => {
    const channel: (value: number) => number = (value: number): number => {
        const normalised: number = value / 255;
        return normalised <= 0.04045 ? normalised / 12.92 : ((normalised + 0.055) / 1.055) ** 2.4;
    };

    return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
};

/**
 * Finds the effective background luminance for a ripple target, walking
 * ancestors when the surface itself is transparent.
 * @param element - Surface that will host the ripple.
 * @example
 * const luminance = backgroundLuminance(element);
 * @returns Luminance from zero to one, or null when no opaque colour is found.
 */
const backgroundLuminance: (element: HTMLElement) => number | null = (
    element: HTMLElement,
): number | null => {
    const style: CSSStyleDeclaration = window.getComputedStyle(element);
    const channels: readonly [number, number, number, number] | null = parseColour(
        style.backgroundColor,
    );

    if (channels !== null && channels[3] >= 0.5) {
        return relativeLuminance(channels[0], channels[1], channels[2]);
    }

    return null;
};

/**
 * Chooses a ripple colour with high contrast against the target background.
 * @param element - Surface that will host the ripple.
 * @example
 * const colour = rippleColour(element);
 * @returns White on dark surfaces, black on light surfaces.
 */
export const rippleColour: (element: HTMLElement) => string = (element: HTMLElement): string => {
    const luminance: number | null = backgroundLuminance(element);

    if (luminance === null) {
        const text: readonly [number, number, number, number] | null = parseColour(
            window.getComputedStyle(element).color,
        );
        const textLuminance: number =
            text === null ? 0 : relativeLuminance(text[0], text[1], text[2]);
        return textLuminance > 0.5 ? "#ffffff" : "#000000";
    }

    const whiteContrast: number = 1.05 / (luminance + 0.05);
    const blackContrast: number = (luminance + 0.05) / 0.05;

    return whiteContrast >= blackContrast ? "#ffffff" : "#000000";
};


export default measureRipple;
