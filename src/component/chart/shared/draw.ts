import type {
    ChartArea,
    ChartSurface,
} from "./types";
import {
    formatChartNumber,
    truncateChartText,
} from "./scale";

/**
 * One positioned label on a categorical axis.
 * Type: interface.
 * Fields: label, x.
 * @example
 * const label: ChartAxisLabel = { label: "Q1", x: 80 };
 */
export interface ChartAxisLabel {
    label: string;
    x: number;
}

/**
 * Options shared by the shared axis painters.
 * Type: interface.
 * Fields: showGrid, formatter.
 * @example
 * drawCartesianAxes(surface, area, xTicks, yTicks, xScale, yScale, { showGrid: true });
 */
export interface ChartAxisOptions {
    showGrid?: boolean;
    formatter?: (value: number) => string;
}

/**
 * Draws the left and bottom axis lines.
 * @example
 * drawAxisLines(surface, area);
 * @param surface - Chart surface.
 * @param area - Plot area.
 * @returns Nothing.
 */
export const drawAxisLines: (surface: ChartSurface, area: ChartArea) => void = (
    surface: ChartSurface,
    area: ChartArea,
): void => {
    const color: string = surface.palette.axis;

    surface.line(area.x, area.y, area.x, area.y + area.height, color, 1);
    surface.line(area.x, area.y + area.height, area.x + area.width, area.y + area.height, color, 1);
};

/**
 * Draws horizontal grid lines and value labels for a linear y axis.
 * @example
 * drawYAxis(surface, area, niceTicks(0, 100), (value) => area.y + area.height - value, { showGrid: true });
 * @param surface - Chart surface.
 * @param area - Plot area.
 * @param ticks - Tick values.
 * @param scale - Maps a tick value to its pixel y position.
 * @param options - Grid and formatter options.
 * @returns Nothing.
 */
export const drawYAxis: (
    surface: ChartSurface,
    area: ChartArea,
    ticks: readonly number[],
    scale: (value: number) => number,
    options?: ChartAxisOptions,
) => void = (
    surface: ChartSurface,
    area: ChartArea,
    ticks: readonly number[],
    scale: (value: number) => number,
    options?: ChartAxisOptions,
): void => {
    const showGrid: boolean = options?.showGrid ?? true;
    const formatter: (value: number) => string =
        options?.formatter ?? ((value: number): string => formatChartNumber(value));
    const labelWidth: number = Math.max(0, area.x - 12);

    for (const tick of ticks) {
        const y: number = scale(tick);

        if (!Number.isFinite(y) || y < area.y - 1 || y > area.y + area.height + 1) {
            continue;
        }

        if (showGrid) {
            surface.line(area.x, y, area.x + area.width, y, surface.palette.grid, 1);
        }

        const label: string = truncateChartText(surface, formatter(tick), labelWidth, {
            font: "11px \"Roboto\", system-ui, sans-serif",
        });

        if (label.length > 0) {
            surface.text(label, area.x - 8, y, {
                align: "right",
                baseline: "middle",
                color: surface.palette.muted,
                font: "11px \"Roboto\", system-ui, sans-serif",
                maxWidth: labelWidth,
            });
        }
    }
};

/**
 * Draws numeric ticks and labels on a linear x axis.
 * @example
 * drawXAxisTicks(surface, area, niceTicks(0, 10), xScale);
 * @param surface - Chart surface.
 * @param area - Plot area.
 * @param ticks - Tick values.
 * @param scale - Maps a tick value to its pixel x position.
 * @param options - Grid and formatter options.
 * @returns Nothing.
 */
export const drawXAxisTicks: (
    surface: ChartSurface,
    area: ChartArea,
    ticks: readonly number[],
    scale: (value: number) => number,
    options?: ChartAxisOptions,
) => void = (
    surface: ChartSurface,
    area: ChartArea,
    ticks: readonly number[],
    scale: (value: number) => number,
    options?: ChartAxisOptions,
): void => {
    const showGrid: boolean = options?.showGrid ?? true;
    const formatter: (value: number) => string =
        options?.formatter ?? ((value: number): string => formatChartNumber(value));
    const slot: number = area.width / Math.max(1, ticks.length);
    const maxWidth: number = Math.max(16, slot - 8);

    for (const tick of ticks) {
        const x: number = scale(tick);

        if (!Number.isFinite(x) || x < area.x - 1 || x > area.x + area.width + 1) {
            continue;
        }

        if (showGrid) {
            surface.line(x, area.y, x, area.y + area.height, surface.palette.grid, 1);
        }

        const label: string = truncateChartText(surface, formatter(tick), maxWidth, {
            font: "11px \"Roboto\", system-ui, sans-serif",
        });

        if (label.length > 0) {
            surface.text(label, x, area.y + area.height + 8, {
                align: "center",
                baseline: "top",
                color: surface.palette.muted,
                font: "11px \"Roboto\", system-ui, sans-serif",
                maxWidth,
            });
        }
    }
};

/**
 * Draws positioned labels along the bottom of a categorical axis.
 * Labels are truncated and skipped when the plot is too narrow.
 * @example
 * drawXAxisLabels(surface, area, [{ label: "Q1", x: 80 }, { label: "Q2", x: 160 }]);
 * @param surface - Chart surface.
 * @param area - Plot area.
 * @param labels - Positioned labels.
 * @returns Nothing.
 */
export const drawXAxisLabels: (
    surface: ChartSurface,
    area: ChartArea,
    labels: readonly ChartAxisLabel[],
) => void = (
    surface: ChartSurface,
    area: ChartArea,
    labels: readonly ChartAxisLabel[],
): void => {
    if (labels.length === 0) {
        return;
    }

    const slot: number = area.width / labels.length;
    const skip: number = slot < 20 ? Math.max(1, Math.ceil(20 / Math.max(slot, 1))) : 1;
    const maxWidth: number = Math.max(12, slot * skip - 6);

    for (let index: number = 0; index < labels.length; index += skip) {
        const entry: ChartAxisLabel = labels[index];
        const label: string = truncateChartText(surface, entry.label, maxWidth, {
            font: "11px \"Roboto\", system-ui, sans-serif",
        });

        if (label.length === 0) {
            continue;
        }

        surface.text(label, entry.x, area.y + area.height + 8, {
            align: "center",
            baseline: "top",
            color: surface.palette.muted,
            font: "11px \"Roboto\", system-ui, sans-serif",
            maxWidth,
        });
    }
};

/**
 * Draws grid, labels, and axis lines for two linear axes.
 * @example
 * drawCartesianAxes(surface, area, xTicks, yTicks, xScale, yScale);
 * @param surface - Chart surface.
 * @param area - Plot area.
 * @param xTicks - X tick values.
 * @param yTicks - Y tick values.
 * @param xScale - X mapping function.
 * @param yScale - Y mapping function.
 * @param options - Grid and formatter options.
 * @returns Nothing.
 */
export const drawCartesianAxes: (
    surface: ChartSurface,
    area: ChartArea,
    xTicks: readonly number[],
    yTicks: readonly number[],
    xScale: (value: number) => number,
    yScale: (value: number) => number,
    options?: ChartAxisOptions,
) => void = (
    surface: ChartSurface,
    area: ChartArea,
    xTicks: readonly number[],
    yTicks: readonly number[],
    xScale: (value: number) => number,
    yScale: (value: number) => number,
    options?: ChartAxisOptions,
): void => {
    drawYAxis(surface, area, yTicks, yScale, options);
    drawXAxisTicks(surface, area, xTicks, xScale, options);
    drawAxisLines(surface, area);
};

/**
 * Draws a "No data" message in the centre of the plot.
 * @example
 * drawEmptyState(surface, "No results");
 * @param surface - Chart surface.
 * @param label - Message to draw.
 * @returns Nothing.
 */
export const drawEmptyState: (surface: ChartSurface, label: string) => void = (
    surface: ChartSurface,
    label: string,
): void => {
    surface.text(label, surface.width / 2, surface.height / 2, {
        align: "center",
        baseline: "middle",
        color: surface.palette.muted,
        font: "13px \"Roboto\", system-ui, sans-serif",
    });
};
