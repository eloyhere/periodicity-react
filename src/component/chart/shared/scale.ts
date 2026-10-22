import type {
    ChartArea,
    ChartMargin,
    ChartSurface,
    ChartTextOptions,
} from "./types";

/**
 * Categorical band scale returned by {@link createBandScale}.
 * Type: interface.
 * Fields: step, bandwidth, position.
 * @example
 * const band: ChartBandScale = createBandScale(4, 0, 400);
 * const x: number = band.position(1) + band.bandwidth / 2;
 */
export interface ChartBandScale {
    /** Distance between the starts of adjacent bands. */
    readonly step: number;
    /** Width of one band after padding. */
    readonly bandwidth: number;
    /** Left edge of the band at the given index. */
    position(index: number): number;
}

/**
 * Returns a "nice" step for a numeric range.
 * @example
 * niceStep(97, 5); // 20
 * @param span - Difference between the highest and lowest values.
 * @param count - Desired number of intervals.
 * @returns Step size in the same unit as the span.
 */
export const niceStep: (span: number, count: number) => number = (span: number, count: number): number => {
    const safeCount: number = Math.max(1, Math.floor(count));
    const raw: number = Math.abs(span) / safeCount;

    if (!Number.isFinite(raw) || raw <= 0) {
        return 1;
    }

    const power: number = 10 ** Math.floor(Math.log10(raw));
    const error: number = raw / power;
    const factor: number = error >= 7.5 ? 10 : error >= 3.5 ? 5 : error >= 1.5 ? 2 : 1;

    return factor * power;
};

/**
 * Builds inclusive, rounded tick values covering a numeric range.
 * @example
 * niceTicks(0, 97, 5); // [0, 20, 40, 60, 80, 100]
 * @param min - Lower domain bound.
 * @param max - Upper domain bound.
 * @param count - Desired number of intervals.
 * @returns Tick values in ascending order.
 */
export const niceTicks: (min: number, max: number, count?: number) => readonly number[] = (
    min: number,
    max: number,
    count: number = 5,
): readonly number[] => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return [];
    }

    const lower: number = Math.min(min, max);
    const upper: number = Math.max(min, max);

    if (lower === upper) {
        return [lower];
    }

    const step: number = niceStep(upper - lower, count);
    const start: number = Math.ceil(lower / step) * step;
    const ticks: number[] = [];

    for (let value: number = start; value <= upper + step * 1e-9; value += step) {
        ticks.push(Number(value.toFixed(10)));

        if (ticks.length > 1000) {
            break;
        }
    }

    return ticks;
};

/**
 * Expands a numeric domain so its endpoints land on rounded tick values.
 * @example
 * niceDomain(3, 97); // [0, 100]
 * @param min - Lower data bound.
 * @param max - Upper data bound.
 * @param count - Desired number of intervals.
 * @returns Padded domain.
 */
export const niceDomain: (min: number, max: number, count?: number) => readonly [number, number] = (
    min: number,
    max: number,
    count: number = 5,
): readonly [number, number] => {
    const ticks: readonly number[] = niceTicks(min, max, count);

    if (ticks.length === 0) {
        return [min, max];
    }

    return [Math.min(min, ticks[0]), Math.max(max, ticks[ticks.length - 1])];
};

/**
 * Creates a linear scale from a numeric domain to a pixel range.
 * A zero-width domain maps every value to the middle of the range.
 * @example
 * const x: (value: number) => number = createLinearScale(0, 100, 40, 440);
 * @param domainMin - Domain value mapped to `rangeMin`.
 * @param domainMax - Domain value mapped to `rangeMax`.
 * @param rangeMin - Pixel value for `domainMin`.
 * @param rangeMax - Pixel value for `domainMax`.
 * @returns Mapping function.
 */
export const createLinearScale: (
    domainMin: number,
    domainMax: number,
    rangeMin: number,
    rangeMax: number,
) => (value: number) => number = (
    domainMin: number,
    domainMax: number,
    rangeMin: number,
    rangeMax: number,
): ((value: number) => number) => {
    const span: number = domainMax - domainMin;

    if (!Number.isFinite(span) || span === 0) {
        const middle: number = rangeMin + (rangeMax - rangeMin) / 2;

        return (): number => middle;
    }

    return (value: number): number =>
        rangeMin + ((value - domainMin) / span) * (rangeMax - rangeMin);
};

/**
 * Creates a categorical band scale.
 * @example
 * const band: ChartBandScale = createBandScale(3, 40, 440, 0.2);
 * @param count - Number of bands.
 * @param start - Left edge of the scale.
 * @param end - Right edge of the scale.
 * @param padding - Fraction of each step reserved as gap; 0..1.
 * @returns Band scale.
 */
export const createBandScale: (
    count: number,
    start: number,
    end: number,
    padding?: number,
) => ChartBandScale = (
    count: number,
    start: number,
    end: number,
    padding: number = 0.2,
): ChartBandScale => {
    const safeCount: number = Math.max(0, Math.floor(count));
    const span: number = Math.max(0, end - start);

    if (safeCount === 0) {
        return {
            step: 0,
            bandwidth: 0,
            position: (): number => start,
        };
    }

    const step: number = span / safeCount;
    const safePadding: number = Math.min(0.95, Math.max(0, padding));
    const bandwidth: number = step * (1 - safePadding);

    return {
        step,
        bandwidth,
        position: (index: number): number => start + index * step + (step - bandwidth) / 2,
    };
};

/**
 * Returns the smallest and largest finite values.
 * @example
 * extent([3, 1, 8]); // [1, 8]
 * @param values - Numeric values.
 * @returns Extent, or `[0, 0]` when no finite values exist.
 */
export const chartExtent: (values: readonly number[]) => readonly [number, number] = (
    values: readonly number[],
): readonly [number, number] => {
    let min: number = Number.POSITIVE_INFINITY;
    let max: number = Number.NEGATIVE_INFINITY;

    for (const value of values) {
        if (Number.isFinite(value)) {
            min = Math.min(min, value);
            max = Math.max(max, value);
        }
    }

    return Number.isFinite(min) && Number.isFinite(max) ? [min, max] : [0, 0];
};

/**
 * Sums numeric values, ignoring non-finite entries.
 * @example
 * sumChartValues([1, 2, 3]); // 6
 * @param values - Numeric values.
 * @returns Sum.
 */
export const sumChartValues: (values: readonly number[]) => number = (values: readonly number[]): number => {
    let total: number = 0;

    for (const value of values) {
        if (Number.isFinite(value)) {
            total += value;
        }
    }

    return total;
};

/**
 * Formats a number for axis and data labels.
 * @example
 * formatChartNumber(12500); // "12.5k"
 * @param value - Numeric value.
 * @param formatter - Optional formatter that takes precedence.
 * @returns Compact label.
 */
export const formatChartNumber: (value: number, formatter?: (value: number) => string) => string = (
    value: number,
    formatter?: (value: number) => string,
): string => {
    if (formatter !== (void 0)) {
        return formatter(value);
    }

    if (!Number.isFinite(value)) {
        return "–";
    }

    const absolute: number = Math.abs(value);
    const trim: (input: number) => string = (input: number): string => {
        const rounded: number = Math.round(input * 10) / 10;

        return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
    };

    if (absolute >= 1_000_000_000) {
        return `${trim(value / 1_000_000_000)}B`;
    }

    if (absolute >= 1_000_000) {
        return `${trim(value / 1_000_000)}M`;
    }

    if (absolute >= 1_000) {
        return `${trim(value / 1_000)}k`;
    }

    return trim(value);
};

/**
 * Formats a ratio as a percentage.
 * @example
 * formatChartPercent(0.256, 1); // "25.6%"
 * @param ratio - Ratio where 1 equals 100%.
 * @param digits - Fraction digits.
 * @returns Percentage label.
 */
export const formatChartPercent: (ratio: number, digits?: number) => string = (
    ratio: number,
    digits: number = 0,
): string => `${(ratio * 100).toFixed(Math.max(0, digits))}%`;

/**
 * Creates the inner plot rectangle after subtracting margins.
 * @example
 * const area: ChartArea = createPlotArea(640, 320, { top: 16, right: 16, bottom: 36, left: 56 });
 * @param width - Surface width.
 * @param height - Surface height.
 * @param margin - Outer spacing.
 * @returns Plot area with non-negative dimensions.
 */
export const createPlotArea: (
    width: number,
    height: number,
    margin: ChartMargin,
) => ChartArea = (width: number, height: number, margin: ChartMargin): ChartArea => ({
    x: margin.left,
    y: margin.top,
    width: Math.max(0, width - margin.left - margin.right),
    height: Math.max(0, height - margin.top - margin.bottom),
});

/**
 * Truncates text with an ellipsis until it fits a maximum width.
 * @example
 * truncateChartText(surface, "Long category", 60);
 * @param surface - Surface used to measure text.
 * @param text - Original label.
 * @param maxWidth - Available width in pixels.
 * @param options - Font options used for measurement and drawing.
 * @returns Text that fits, or an empty string when no width is available.
 */
export const truncateChartText: (
    surface: ChartSurface,
    text: string,
    maxWidth: number,
    options?: ChartTextOptions,
) => string = (
    surface: ChartSurface,
    text: string,
    maxWidth: number,
    options?: ChartTextOptions,
): string => {
    if (maxWidth <= 0) {
        return "";
    }

    if (surface.measure(text, options) <= maxWidth) {
        return text;
    }

    const ellipsis: string = "…";

    if (surface.measure(ellipsis, options) > maxWidth) {
        return "";
    }

    let low: number = 0;
    let high: number = text.length;

    while (low < high) {
        const middle: number = Math.ceil((low + high) / 2);
        const candidate: string = `${text.slice(0, middle)}${ellipsis}`;

        if (surface.measure(candidate, options) <= maxWidth) {
            low = middle;
        } else {
            high = middle - 1;
        }
    }

    return `${text.slice(0, low)}${ellipsis}`;
};
