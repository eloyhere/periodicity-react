import { useCallback, type FC } from "react";
import ChartDataTable from "../shared/ChartDataTable";
import ChartFrame from "../shared/ChartFrame";
import { useInternational, type InternationalContextValue } from "../../../international";
import { chartColorWithAlpha } from "../shared/color";
import {
    drawAxisLines,
    drawEmptyState,
    drawXAxisTicks,
    drawYAxis,
    type ChartAxisOptions,
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
    ChartPoint,
    ChartSurface,
} from "../shared/types";

/**
 * One data point on a line series.
 * Type: interface.
 * @param x - Position along the x axis.
 * @param y - Value on the y axis.
 * @param label - Optional caller-facing name for the point.
 * @example
 * const point: LineChartPoint = { x: 1, y: 42, label: "January" };
 */
export interface LineChartPoint {
    x: number;
    y: number;
    label?: string;
}

/**
 * One named line drawn by the chart.
 * Type: interface.
 * @param id - Stable identifier used by the legend and callers.
 * @param label - Name shown in the legend and the accessible table.
 * @param color - Optional series colour; the resolved palette is used when omitted.
 * @param points - Points in drawing order; the chart never reorders them.
 * @example
 * const series: LineChartSeries = {
 *     id: "revenue",
 *     label: "Revenue",
 *     points: [{ x: 0, y: 12 }, { x: 1, y: 18 }],
 * };
 */
export interface LineChartSeries {
    id: string;
    label: string;
    color?: string;
    points: readonly LineChartPoint[];
}

/**
 * Props for the line chart.
 * Type: interface.
 * Extends `ChartBaseProps`, so `height`, `renderer`, `renderPriority`, `palette`, `showLegend`,
 * `valueFormatter`, `emptyLabel`, `className`, `ref`, and the native `div` attributes are shared
 * with every chart.
 * @param series - Lines to draw.
 * @param area - Whether to fill the region between each line and the baseline; defaults to `false`.
 * @param showPoints - Whether to draw a marker at every finite point; defaults to `false`.
 * @param xFormatter - Formats x values in axis labels and the accessible table.
 * @param yFormatter - Formats y values in axis labels and the accessible table; wins over `valueFormatter`.
 * @example
 * <LineChart
 *     ariaLabel="Monthly revenue"
 *     series={[{ id: "revenue", label: "Revenue", points: [{ x: 0, y: 12 }, { x: 1, y: 18 }] }]}
 *     area
 *     showPoints
 * />
 */
export interface LineChartProps extends ChartBaseProps {
    series: readonly LineChartSeries[];
    area?: boolean;
    showPoints?: boolean;
    xFormatter?: (value: number) => string;
    yFormatter?: (value: number) => string;
}

/** Outer spacing of the plot inside the surface. */
const LineChartMargin: ChartMargin = {
    top: 16,
    right: 16,
    bottom: 40,
    left: 56,
};

/** Fraction of the absolute value added to each side of a zero-width domain. */
const ZeroWidthDomainRatio: number = 0.1;

/** Absolute padding added to each side of a zero-width domain centred on zero. */
const ZeroWidthDomainPadding: number = 1;

/** Desired number of y-axis intervals. */
const YTickCount: number = 5;

/** Pixel slot reserved for one x-axis tick when choosing the tick count. */
const XTickSlotWidth: number = 96;

/** Smallest number of x-axis intervals. */
const MinXTickCount: number = 2;

/** Largest number of x-axis intervals. */
const MaxXTickCount: number = 8;

/** Stroke width of every line. */
const LineStrokeWidth: number = 2;

/** Radius of the optional point markers. */
const PointMarkerRadius: number = 3;

/** Opacity of the area fill under each line. */
const AreaFillOpacity: number = 0.16;

/**
 * Reports whether both coordinates of a point are finite.
 * @example
 * isFinitePoint({ x: 1, y: 2 }); // true
 * @param point - Point to inspect.
 * @returns `true` when the point can be plotted.
 */
const isFinitePoint: (point: LineChartPoint) => boolean = (point: LineChartPoint): boolean =>
    Number.isFinite(point.x) && Number.isFinite(point.y);

/**
 * Expands a zero-width domain symmetrically so a scale never divides by zero.
 * @example
 * expandDomain(5, 5); // [4.5, 5.5]
 * @param min - Lower bound of the extent.
 * @param max - Upper bound of the extent.
 * @returns A non-zero-width domain in ascending order.
 */
const expandDomain: (min: number, max: number) => readonly [number, number] = (
    min: number,
    max: number,
): readonly [number, number] => {
    if (min !== max) {
        return [min, max];
    }

    const padding: number =
        Math.abs(min) > 0 ? Math.abs(min) * ZeroWidthDomainRatio : ZeroWidthDomainPadding;

    return [min - padding, min + padding];
};

/**
 * Resolves the legend swatch colour for one series.
 * @example
 * resolveLegendColor({ id: "revenue", label: "Revenue", points: [] }, 0, ["#1976d2"]); // "#1976d2"
 * @param series - Series being described.
 * @param index - Zero-based series index.
 * @param palette - Optional custom palette supplied to the chart.
 * @returns CSS colour used by the legend swatch.
 */
const resolveLegendColor: (
    series: LineChartSeries,
    index: number,
    palette?: readonly string[],
) => string = (
    series: LineChartSeries,
    index: number,
    palette?: readonly string[],
): string => {
    if (series.color !== (void 0)) {
        return series.color;
    }

    if (palette !== (void 0) && palette.length > 0) {
        return palette[index % palette.length];
    }

    return chartSeriesToken(index);
};

/**
 * Builds one legend entry per series.
 * @example
 * createLegendItems([{ id: "revenue", label: "Revenue", points: [] }]); // [{ id: "revenue", label: "Revenue", color: "var(--color-primary)" }]
 * @param series - Series to describe.
 * @param palette - Optional custom palette supplied to the chart.
 * @returns Legend entries in series order.
 */
const createLegendItems: (
    series: readonly LineChartSeries[],
    palette?: readonly string[],
) => readonly ChartLegendItem[] = (
    series: readonly LineChartSeries[],
    palette?: readonly string[],
): readonly ChartLegendItem[] =>
    series.map(
        (entry: LineChartSeries, index: number): ChartLegendItem => ({
            id: entry.id,
            label: entry.label,
            color: resolveLegendColor(entry, index, palette),
        }),
    );

/**
 * Builds accessible table rows for every finite point.
 * @example
 * createTableRows([{ id: "revenue", label: "Revenue", points: [{ x: 1, y: 2 }] }]);
 * // [["Revenue", "1", "2"]]
 * @param series - Series to tabulate.
 * @param xFormatter - Optional x-axis formatter.
 * @param yFormatter - Optional y-axis formatter.
 * @returns One row per finite point, in series and point order.
 */
const createTableRows: (
    series: readonly LineChartSeries[],
    xFormatter?: (value: number) => string,
    yFormatter?: (value: number) => string,
) => readonly (readonly (string | number)[])[] = (
    series: readonly LineChartSeries[],
    xFormatter?: (value: number) => string,
    yFormatter?: (value: number) => string,
): readonly (readonly (string | number)[])[] => {
    const rows: (readonly (string | number)[])[] = [];

    for (const entry of series) {
        for (const point of entry.points) {
            if (!isFinitePoint(point)) {
                continue;
            }

            rows.push([
                entry.label,
                formatChartNumber(point.x, xFormatter),
                formatChartNumber(point.y, yFormatter),
            ]);
        }
    }

    return rows;
};

/**
 * Renders one or more numeric lines on a responsive shared chart frame.
 * Points keep the order supplied by the caller; non-finite points are skipped for drawing and for
 * the accessible table. Zero-width domains are padded symmetrically before rounding so neither
 * axis ever collapses.
 * @param props - Series, area and point options, formatters, and shared chart props.
 * @example
 * <LineChart
 *     ariaLabel="Monthly revenue"
 *     series={[{ id: "revenue", label: "Revenue", points: [{ x: 0, y: 12 }, { x: 1, y: 18 }] }]}
 *     area
 *     showPoints
 * />
 * @returns A responsive line chart.
 */
const LineChart: FC<LineChartProps> = ({
    series,
    area = false,
    showPoints = false,
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
    className,
    ref,
    ...rest
}: LineChartProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedAriaLabel: string = ariaLabel ?? t("lineChart");
    const resolvedEmptyLabel: string = emptyLabel ?? t("noData");
    const legendItems: readonly ChartLegendItem[] = createLegendItems(series, palette);
    const tableRows: readonly (readonly (string | number)[])[] = createTableRows(
        series,
        xFormatter,
        yFormatter ?? valueFormatter,
    );
    const render: (surface: ChartSurface) => void = useCallback(
        (surface: ChartSurface): void => {
            const finitePoints: readonly (readonly LineChartPoint[])[] = series.map(
                (entry: LineChartSeries): readonly LineChartPoint[] =>
                    entry.points.filter(isFinitePoint),
            );
            const xValues: number[] = [];
            const yValues: number[] = [];

            for (const points of finitePoints) {
                for (const point of points) {
                    xValues.push(point.x);
                    yValues.push(point.y);
                }
            }

            if (xValues.length === 0) {
                drawEmptyState(surface, resolvedEmptyLabel);

                return;
            }

            const xExtent: readonly [number, number] = chartExtent(xValues);
            const yExtent: readonly [number, number] = chartExtent(yValues);
            const plot: ChartArea = createPlotArea(surface.width, surface.height, LineChartMargin);
            const xTickCount: number = Math.max(
                MinXTickCount,
                Math.min(MaxXTickCount, Math.floor(plot.width / XTickSlotWidth)),
            );
            const xBounds: readonly [number, number] = expandDomain(xExtent[0], xExtent[1]);
            const yBounds: readonly [number, number] = expandDomain(yExtent[0], yExtent[1]);
            const xDomain: readonly [number, number] = niceDomain(
                xBounds[0],
                xBounds[1],
                xTickCount,
            );
            const yDomain: readonly [number, number] = niceDomain(
                yBounds[0],
                yBounds[1],
                YTickCount,
            );
            const xTicks: readonly number[] = niceTicks(xDomain[0], xDomain[1], xTickCount);
            const yTicks: readonly number[] = niceTicks(yDomain[0], yDomain[1], YTickCount);
            const xScale: (value: number) => number = createLinearScale(
                xDomain[0],
                xDomain[1],
                plot.x,
                plot.x + plot.width,
            );
            const yScale: (value: number) => number = createLinearScale(
                yDomain[0],
                yDomain[1],
                plot.y + plot.height,
                plot.y,
            );
            const pointsBySeries: readonly (readonly ChartPoint[])[] = finitePoints.map(
                (points: readonly LineChartPoint[]): readonly ChartPoint[] =>
                    points.map((point: LineChartPoint): ChartPoint => ({
                        x: xScale(point.x),
                        y: yScale(point.y),
                    })),
            );
            const colors: readonly string[] = series.map(
                (entry: LineChartSeries, index: number): string =>
                    entry.color ?? seriesColor(surface.palette, index),
            );

            if (area) {
                for (let index: number = 0; index < pointsBySeries.length; index += 1) {
                    surface.area(
                        pointsBySeries[index],
                        plot.y + plot.height,
                        chartColorWithAlpha(colors[index], AreaFillOpacity),
                    );
                }
            }

            for (let index: number = 0; index < pointsBySeries.length; index += 1) {
                const points: readonly ChartPoint[] = pointsBySeries[index];

                surface.polylines([
                    { points, width: LineStrokeWidth, color: colors[index] },
                ]);

                if (showPoints) {
                    surface.circles(
                        points.map(
                            (point: ChartPoint): ChartCircle => ({
                                x: point.x,
                                y: point.y,
                                radius: PointMarkerRadius,
                            }),
                        ),
                        colors[index],
                    );
                }
            }

            const yAxisOptions: ChartAxisOptions = { showGrid };

            if (yFormatter !== (void 0)) {
                yAxisOptions.formatter = yFormatter;
            } else if (valueFormatter !== (void 0)) {
                yAxisOptions.formatter = valueFormatter;
            }

            const xAxisOptions: ChartAxisOptions = { showGrid: false };

            if (xFormatter !== (void 0)) {
                xAxisOptions.formatter = xFormatter;
            }

            drawYAxis(surface, plot, yTicks, yScale, yAxisOptions);
            drawXAxisTicks(surface, plot, xTicks, xScale, xAxisOptions);
            drawAxisLines(surface, plot);
        },
        [series, area, showPoints, showGrid, xFormatter, yFormatter, valueFormatter, resolvedEmptyLabel],
    );

    return (
        <ChartFrame
            {...rest}
            ariaLabel={resolvedAriaLabel}
            chartType="line"
            height={height}
            renderer={renderer}
            renderPriority={renderPriority}
            palette={palette}
            showLegend={showLegend}
            legend={legendItems}
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

export default LineChart;
