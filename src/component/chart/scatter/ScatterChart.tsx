import { useCallback, useMemo, type FC } from "react";
import ChartDataTable from "../shared/ChartDataTable";
import ChartFrame from "../shared/ChartFrame";
import { useInternational, type InternationalContextValue } from "../../../international";
import {
    drawAxisLines,
    drawEmptyState,
    drawXAxisTicks,
    drawYAxis,
} from "../shared/draw";
import { chartSeriesToken, seriesColor } from "../shared/palette";
import {
    chartExtent,
    createLinearScale,
    createPlotArea,
    formatChartNumber,
    niceDomain,
    niceTicks,
} from "../shared/scale";
import type {
    ChartArea,
    ChartBaseProps,
    ChartCircle,
    ChartLegendItem,
    ChartMargin,
    ChartSurface,
} from "../shared/types";

/** Default radius of one point in CSS pixels. */
const DefaultScatterPointRadius: number = 4;

/** Space reserved around the scatter plot. */
const ScatterMargin: ChartMargin = { top: 16, right: 16, bottom: 40, left: 56 };

/**
 * One scatter point in data space.
 * Type: interface.
 * @param x - Horizontal value.
 * @param y - Vertical value.
 * @param label - Optional name of the point for tooltips and annotations.
 * @example
 * const point: ScatterPoint = { x: 12, y: 40, label: "Sample A" };
 */
export interface ScatterPoint {
    x: number;
    y: number;
    label?: string;
}

/**
 * One named group of scatter points.
 * Type: interface.
 * @param id - Stable identifier used by the legend and the accessible table.
 * @param label - Human-readable series name.
 * @param color - Optional colour override for this series.
 * @param points - Points belonging to the series.
 * @example
 * const series: ScatterSeries = { id: "control", label: "Control", points: [{ x: 1, y: 2 }] };
 */
export interface ScatterSeries {
    id: string;
    label: string;
    color?: string;
    points: readonly ScatterPoint[];
}

/**
 * Props for the scatter chart.
 * Type: interface.
 * Extends the shared chart props, so `ariaLabel`, `height`, `renderer`,
 * `renderPriority`, `palette`, `showLegend`, `showGrid`, `valueFormatter`,
 * `emptyLabel`, `className`, `ref`, and any native `div` attributes are forwarded
 * to the chart frame.
 * @param series - Series drawn on the plot and summarised in the accessible table.
 * @param pointRadius - Radius of every point in CSS pixels; defaults to `4`.
 * @param xFormatter - Formats x axis labels and the x column of the accessible table.
 * @param yFormatter - Formats y axis labels and the y column of the accessible table.
 * @example
 * <ScatterChart
 *     series={[{ id: "a", label: "Group A", points: [{ x: 1, y: 2 }] }]}
 *     xFormatter={(value) => `${value} ms`}
 * />
 */
export interface ScatterChartProps extends ChartBaseProps {
    series: readonly ScatterSeries[];
    pointRadius?: number;
    xFormatter?: (value: number) => string;
    yFormatter?: (value: number) => string;
}

/**
 * Reports whether a point has finite coordinates on both axes.
 * @param point - Point to inspect.
 * @example
 * isFinitePoint({ x: 1, y: 2 }); // true
 * @returns `true` when both coordinates are finite.
 */
const isFinitePoint: (point: ScatterPoint) => boolean = (point: ScatterPoint): boolean =>
    Number.isFinite(point.x) && Number.isFinite(point.y);

/**
 * Widens a collapsed domain around its value so the linear scale never divides by zero.
 * Non-zero values receive a ten percent margin; a zero value falls back to ±1.
 * @param min - Lower domain bound.
 * @param max - Upper domain bound.
 * @example
 * padCollapsedDomain(5, 5); // [4.5, 5.5]
 * @returns Bounds with a non-zero span.
 */
const padCollapsedDomain: (min: number, max: number) => readonly [number, number] = (
    min: number,
    max: number,
): readonly [number, number] => {
    const magnitude: number = Math.abs(min);
    const padding: number = magnitude > 0 ? magnitude * 0.1 : 1;

    return [min - padding, max + padding];
};

/**
 * Resolves the legend colour of one series, preferring the series colour, then the
 * supplied palette, then the theme token for the series index.
 * @param entry - Series definition.
 * @param index - Zero-based series index.
 * @param palette - Palette supplied to the chart.
 * @example
 * resolveLegendColor({ id: "a", label: "A", points: [] }, 0); // "var(--color-primary)"
 * @returns A CSS colour or custom property reference.
 */
const resolveLegendColor: (
    entry: ScatterSeries,
    index: number,
    palette?: readonly string[],
) => string = (
    entry: ScatterSeries,
    index: number,
    palette?: readonly string[],
): string => entry.color ?? palette?.[index % palette.length] ?? chartSeriesToken(index);

/**
 * Builds the accessible table rows for every finite point.
 * @param series - Series to flatten.
 * @param xFormatter - Formatter for the x column.
 * @param yFormatter - Formatter for the y column, ahead of `valueFormatter`.
 * @param valueFormatter - Fallback formatter for the y column.
 * @example
 * createScatterRows([{ id: "a", label: "A", points: [{ x: 1, y: 2 }] }]); // [["A", "1", "2"]]
 * @returns One row per finite point, labelled with its series.
 */
const createScatterRows: (
    series: readonly ScatterSeries[],
    xFormatter?: (value: number) => string,
    yFormatter?: (value: number) => string,
    valueFormatter?: (value: number) => string,
) => readonly (readonly (string | number)[])[] = (
    series: readonly ScatterSeries[],
    xFormatter?: (value: number) => string,
    yFormatter?: (value: number) => string,
    valueFormatter?: (value: number) => string,
): readonly (readonly (string | number)[])[] => {
    const rows: (readonly (string | number)[])[] = [];

    for (const entry of series) {
        for (const point of entry.points) {
            if (isFinitePoint(point)) {
                rows.push([
                    entry.label,
                    formatChartNumber(point.x, xFormatter),
                    formatChartNumber(point.y, yFormatter ?? valueFormatter),
                ]);
            }
        }
    }

    return rows;
};

/**
 * Renders a responsive scatter chart with numeric x and y axes, a legend, and a
 * screen-reader data table. Points are drawn before the axes so grid lines and
 * labels stay crisp on the overlay canvas.
 * @param props - Series, point styling, formatters, and shared chart options.
 * @example
 * <ScatterChart
 *     ariaLabel="Latency samples"
 *     series={[{ id: "cold", label: "Cold start", points: [{ x: 4, y: 120 }] }]}
 * />
 * @returns A scatter chart inside the shared chart frame.
 */
const ScatterChart: FC<ScatterChartProps> = (props: ScatterChartProps) => {
    const { t }: InternationalContextValue = useInternational();
    const {
        series,
        pointRadius,
        xFormatter,
        yFormatter,
        ariaLabel,
        height,
        renderer,
        renderPriority,
        palette,
        showLegend = true,
        showGrid = true,
        valueFormatter,
        emptyLabel,
        className = "",
        ref,
        ...rest
    }: ScatterChartProps = props;
    const resolvedAriaLabel: string = ariaLabel ?? t("scatterChart");
    const resolvedEmptyLabel: string = emptyLabel ?? t("noData");
    const legend: readonly ChartLegendItem[] = useMemo(
        (): readonly ChartLegendItem[] =>
            series.map(
                (entry: ScatterSeries, index: number): ChartLegendItem => ({
                    id: entry.id,
                    label: entry.label,
                    color: resolveLegendColor(entry, index, palette),
                }),
            ),
        [series, palette],
    );
    const tableRows: readonly (readonly (string | number)[])[] = useMemo(
        (): readonly (readonly (string | number)[])[] =>
            createScatterRows(series, xFormatter, yFormatter, valueFormatter),
        [series, xFormatter, yFormatter, valueFormatter],
    );

    const render: (surface: ChartSurface) => void = useCallback(
        (surface: ChartSurface): void => {
            const xValues: number[] = [];
            const yValues: number[] = [];

            for (const entry of series) {
                for (const point of entry.points) {
                    if (isFinitePoint(point)) {
                        xValues.push(point.x);
                        yValues.push(point.y);
                    }
                }
            }

            if (xValues.length === 0) {
                drawEmptyState(surface, resolvedEmptyLabel);

                return;
            }

            const xExtent: readonly [number, number] = chartExtent(xValues);
            const yExtent: readonly [number, number] = chartExtent(yValues);
            const xRange: readonly [number, number] =
                xExtent[0] === xExtent[1]
                    ? padCollapsedDomain(xExtent[0], xExtent[1])
                    : xExtent;
            const yRange: readonly [number, number] =
                yExtent[0] === yExtent[1]
                    ? padCollapsedDomain(yExtent[0], yExtent[1])
                    : yExtent;
            const xDomain: readonly [number, number] = niceDomain(xRange[0], xRange[1]);
            const yDomain: readonly [number, number] = niceDomain(yRange[0], yRange[1]);
            const xTicks: readonly number[] = niceTicks(xDomain[0], xDomain[1]);
            const yTicks: readonly number[] = niceTicks(yDomain[0], yDomain[1]);
            const area: ChartArea = createPlotArea(
                surface.width,
                surface.height,
                ScatterMargin,
            );
            const xScale: (value: number) => number = createLinearScale(
                xDomain[0],
                xDomain[1],
                area.x,
                area.x + area.width,
            );
            const yScale: (value: number) => number = createLinearScale(
                yDomain[0],
                yDomain[1],
                area.y + area.height,
                area.y,
            );
            const radius: number = pointRadius ?? DefaultScatterPointRadius;

            for (let index: number = 0; index < series.length; index += 1) {
                const entry: ScatterSeries = series[index];
                const circles: ChartCircle[] = [];

                for (const point of entry.points) {
                    if (isFinitePoint(point)) {
                        circles.push({ x: xScale(point.x), y: yScale(point.y), radius });
                    }
                }

                if (circles.length > 0) {
                    surface.circles(
                        circles,
                        entry.color ?? seriesColor(surface.palette, index),
                    );
                }
            }

            const xLabel: (value: number) => string = xFormatter ?? formatChartNumber;
            const yLabel: (value: number) => string =
                yFormatter ?? valueFormatter ?? formatChartNumber;

            // The shared `drawCartesianAxes` painter takes one formatter, so paint the two
            // axes through the same shared primitives to keep the formatters independent.
            drawYAxis(surface, area, yTicks, yScale, {
                showGrid,
                formatter: yLabel,
            });
            drawXAxisTicks(surface, area, xTicks, xScale, {
                showGrid,
                formatter: xLabel,
            });
            drawAxisLines(surface, area);
        },
        [series, pointRadius, showGrid, xFormatter, yFormatter, valueFormatter, resolvedEmptyLabel],
    );

    return (
        <ChartFrame
            {...rest}
            ariaLabel={resolvedAriaLabel}
            chartType="scatter"
            height={height}
            renderer={renderer}
            renderPriority={renderPriority}
            palette={palette}
            showLegend={showLegend}
            legend={legend}
            table={
                <ChartDataTable
                    caption={resolvedAriaLabel}
                    headers={[t("series"), t("axisX"), t("axisY")]}
                    rows={tableRows}
                />
            }
            render={render}
            className={className}
            ref={ref}
        />
    );
};

export default ScatterChart;
