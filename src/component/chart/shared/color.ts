/**
 * Parses a CSS colour into straight RGBA channels in the 0..1 range.
 * Supports hex, rgb(), rgba(), the `transparent` keyword, and the common named
 * colours used by themes. Unknown values fall back to opaque black.
 * @example
 * parseChartColor("#1976d2");
 * // [0.098, 0.463, 0.824, 1]
 * @param value - CSS colour string.
 * @returns Red, green, blue, and alpha channels.
 */
export const parseChartColor: (value: string) => readonly [number, number, number, number] = (
    value: string,
): readonly [number, number, number, number] => {
    const input: string = value.trim().toLowerCase();

    if (input === "transparent") {
        return [0, 0, 0, 0];
    }

    if (input === "white") {
        return [1, 1, 1, 1];
    }

    if (input === "black") {
        return [0, 0, 0, 1];
    }

    if (input.startsWith("#")) {
        const hex: string = input.slice(1);

        if (hex.length === 3 || hex.length === 4) {
            const red: number = Number.parseInt(hex.slice(0, 1).repeat(2), 16);
            const green: number = Number.parseInt(hex.slice(1, 2).repeat(2), 16);
            const blue: number = Number.parseInt(hex.slice(2, 3).repeat(2), 16);
            const alpha: number = hex.length === 4 ? Number.parseInt(hex.slice(3).repeat(2), 16) : 255;

            if (Number.isFinite(red) && Number.isFinite(green) && Number.isFinite(blue)) {
                return [red / 255, green / 255, blue / 255, alpha / 255];
            }
        }

        if (hex.length === 6 || hex.length === 8) {
            const red: number = Number.parseInt(hex.slice(0, 2), 16);
            const green: number = Number.parseInt(hex.slice(2, 4), 16);
            const blue: number = Number.parseInt(hex.slice(4, 6), 16);
            const alpha: number = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) : 255;

            if (Number.isFinite(red) && Number.isFinite(green) && Number.isFinite(blue)) {
                return [red / 255, green / 255, blue / 255, alpha / 255];
            }
        }

        return [0, 0, 0, 1];
    }

    const match: RegExpMatchArray | null = input.match(/^rgba?\((.+)\)$/);

    if (match === null) {
        return [0, 0, 0, 1];
    }

    const parts: string[] = match[1].split(/[\s,/]+/).filter((part: string): boolean => part.length > 0);

    if (parts.length < 3) {
        return [0, 0, 0, 1];
    }

    const channel: (part: string, scale: number) => number = (part: string, scale: number): number =>
        part.endsWith("%")
            ? clampColor((Number.parseFloat(part) / 100) * scale, scale)
            : clampColor(Number.parseFloat(part), scale);
    const red: number = channel(parts[0], 255);
    const green: number = channel(parts[1], 255);
    const blue: number = channel(parts[2], 255);
    const alpha: number = parts.length > 3 ? channel(parts[3], 1) : 1;

    return [red / 255, green / 255, blue / 255, alpha];
};

/**
 * Returns a CSS colour with the given alpha applied.
 * @example
 * chartColorWithAlpha("#1976d2", 0.2); // "rgba(25, 118, 210, 0.2)"
 * @param color - Source colour.
 * @param alpha - Target alpha in the 0..1 range.
 * @returns CSS rgba() colour.
 */
export const chartColorWithAlpha: (color: string, alpha: number) => string = (
    color: string,
    alpha: number,
): string => {
    const channels: readonly [number, number, number, number] = parseChartColor(color);
    const safeAlpha: number = Math.min(1, Math.max(0, alpha));

    return `rgba(${Math.round(channels[0] * 255)}, ${Math.round(channels[1] * 255)}, ${Math.round(channels[2] * 255)}, ${safeAlpha})`;
};

/**
 * Clamps a parsed colour channel into its valid range.
 * @example
 * clampColor(300, 255); // 255
 * @param value - Channel value.
 * @param max - Highest allowed value.
 * @returns Clamped value.
 */
const clampColor: (value: number, max: number) => number = (value: number, max: number): number => {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.min(max, Math.max(0, value));
};
