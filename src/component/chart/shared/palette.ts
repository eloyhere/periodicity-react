import type { ChartPalette } from "./types";

/**
 * Palette used when no theme variables are readable.
 * Type: constant.
 * @example
 * const palette: ChartPalette = FallbackChartPalette;
 */
export const FallbackChartPalette: ChartPalette = {
    series: ["#90caf9", "#80cbc4", "#ce93d8", "#ffb74d", "#ef9a9a", "#b39ddb"],
    text: "#e6e2e8",
    muted: "#a9a4ad",
    grid: "rgba(255, 255, 255, 0.12)",
    axis: "rgba(255, 255, 255, 0.3)",
};

/**
 * Resolves a CSS colour value that may contain `var()` or `color-mix()` into a
 * computed `rgb()`/`rgba()` value. Canvas and WebGL cannot parse custom-property
 * references, and the theme tokens in this repository are aliases such as
 * `--color-primary: var(--accent)`.
 * @example
 * const color: string = resolveColorValue(host, "var(--color-primary)");
 * @param host - Mounted element that inherits the theme custom properties.
 * @param value - Raw token value.
 * @returns Concrete colour value when it could be resolved.
 */
const resolveColorValue: (host: HTMLElement, value: string) => string = (
    host: HTMLElement,
    value: string,
): string => {
    const raw: string = value.trim();

    if (
        raw.length === 0 ||
        typeof document === "undefined"
    ) {
        return raw;
    }

    const probe: HTMLSpanElement = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.position = "absolute";
    probe.style.width = "0";
    probe.style.height = "0";
    probe.style.overflow = "hidden";
    probe.style.visibility = "hidden";
    probe.style.color = raw;
    host.appendChild(probe);

    const resolved: string = window.getComputedStyle(probe).color.trim();
    probe.remove();

    return resolved.length > 0 ? resolved : raw;
};

/**
 * Reads one theme custom property, returning a fallback when it is empty.
 * @example
 * const primary: string = readToken(host, style, "--color-primary", "#90caf9");
 * @param host - Mounted element that inherits the theme custom properties.
 * @param style - Computed style of the chart host.
 * @param name - Custom property name.
 * @param fallback - Value used when the property is missing.
 * @returns Resolved colour string.
 */
const readToken: (
    host: HTMLElement,
    style: CSSStyleDeclaration,
    name: string,
    fallback: string,
) => string = (
    host: HTMLElement,
    style: CSSStyleDeclaration,
    name: string,
    fallback: string,
): string => {
    const value: string = style.getPropertyValue(name).trim();

    return resolveColorValue(host, value.length > 0 ? value : fallback);
};

/**
 * Resolves the chart palette from the host's theme variables.
 * The optional custom palette replaces only the series colours; text, grid, and
 * axis colours continue to follow the active theme.
 * @example
 * const palette: ChartPalette = resolveChartPalette(host, ["#1976d2"]);
 * @param host - Root element used to read computed custom properties.
 * @param series - Optional series colours.
 * @returns Resolved chart palette.
 */
export const resolveChartPalette: (
    host: HTMLElement | null,
    series?: readonly string[],
) => ChartPalette = (host: HTMLElement | null, series?: readonly string[]): ChartPalette => {
    const custom: readonly string[] = series?.filter((color: string): boolean => color.trim().length > 0) ?? [];
    const fallback: ChartPalette = FallbackChartPalette;

    if (host === null || typeof window === "undefined") {
        return {
            ...fallback,
            series: custom.length > 0 ? custom : fallback.series,
        };
    }

    const style: CSSStyleDeclaration = window.getComputedStyle(host);
    const themed: readonly string[] = [
        readToken(host, style, "--color-primary", fallback.series[0]),
        readToken(host, style, "--color-secondary", fallback.series[1]),
        readToken(host, style, "--color-tertiary", fallback.series[2]),
        readToken(host, style, "--color-error", fallback.series[3]),
        readToken(host, style, "--color-warning", fallback.series[4]),
        readToken(host, style, "--color-on-surface-variant", fallback.series[5]),
    ];

    return {
        series:
            custom.length > 0
                ? custom.map((color: string): string => resolveColorValue(host, color))
                : themed,
        text: readToken(host, style, "--color-on-surface", fallback.text),
        muted: readToken(host, style, "--color-on-surface-variant", fallback.muted),
        grid: readToken(host, style, "--color-outline-variant", fallback.grid),
        axis: readToken(host, style, "--color-outline", fallback.axis),
    };
};

/** CSS token used by each series colour when no custom palette is supplied. */
export const ChartSeriesColorTokens: readonly string[] = [
    "var(--color-primary)",
    "var(--color-secondary)",
    "var(--color-tertiary)",
    "var(--color-error)",
    "var(--color-warning)",
    "var(--color-on-surface-variant)",
];

/**
 * Returns the theme token used by a series swatch.
 * @example
 * const token: string = chartSeriesToken(1); // "var(--color-secondary)"
 * @param index - Zero-based series index.
 * @returns CSS custom property reference.
 */
export const chartSeriesToken: (index: number) => string = (index: number): string =>
    ChartSeriesColorTokens[((index % ChartSeriesColorTokens.length) + ChartSeriesColorTokens.length) % ChartSeriesColorTokens.length];

/**
 * Returns a series colour, cycling through the palette.
 * @example
 * const color: string = seriesColor(palette, 2);
 * @param palette - Resolved chart palette.
 * @param index - Zero-based series index.
 * @returns Colour string.
 */
export const seriesColor: (palette: ChartPalette, index: number) => string = (
    palette: ChartPalette,
    index: number,
): string => {
    const colors: readonly string[] = palette.series.length > 0 ? palette.series : FallbackChartPalette.series;

    return colors[((index % colors.length) + colors.length) % colors.length];
};
