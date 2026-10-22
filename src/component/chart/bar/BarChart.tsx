import { useCallback, type FC } from "react";
import ChartDataTable from "../shared/ChartDataTable";
import ChartFrame from "../shared/ChartFrame";
import { useInternational, type InternationalContextValue } from "../../../international";
import {
    drawAxisLines,
    drawEmptyState,
    drawXAxisLabels,
    drawYAxis,
    type ChartAxisLabel,
} from "../shared/draw";
import { chartSeriesToken, seriesColor } from "../shared/palette";
import {
    createBandScale,
    createLinearScale,
    createPlotArea,
    formatChartNumber,
    niceDomain,
    niceTicks,
    type ChartBandScale,
} from "../shared/scale";
import type {
    ChartArea,
    ChartBarRect,
    ChartBaseProps,
    ChartLegendItem,
    ChartMargin,
    ChartSurface,
    ChartTextBaseline,
} from "../shared/types";

/** Outer spacing used by every bar plot. */
const BarPlotMargin: ChartMargin = { top: 16, right: 16, bottom: 36, left: 56 };

/** Font used by value labels above, below, and around the bars. */
const BarLabelFont: string = "11px \"Roboto\", system-ui, sans-serif";

/** Fraction of each category step left free as space between groups. */
const BarBandPadding: number = 0.22;

/** Vertical gap between a bar end and its value label. */
const BarValueGap: number = 4;

/** Narrowest bar that can still carry a readable value label. */
const BarMinValueWidth: number = 16;

/** Largest gap shared by the bars inside one category band. */
const BarMaxGroupGap: number = 4;

/**
 * One series of bars rendered by the bar chart.
 * Type: interface.
 * @param id - Stable identifier used by the legend and React keys.
 * @param label - Human-readable series name.
 * @param color - Optional explicit colour; the resolved chart palette is used otherwise.
 * @param values - One value per category; missing or non-finite entries render as zero.
 * @example
 * const series: BarChartSeries = { id: "revenue", label: "Revenue", values: [12, 18, 9] };
 */
export interface BarChartSeries {
    id: string;
    label: string;
    color?: string;
    values: readonly number[];
}

/**
 * Props for the bar chart.
 * Type: interface.
 * Extends the shared chart props, so `ariaLabel`, `height`, `renderer`,
 * `renderPriority`, `palette`, `showLegend`, `showGrid`, `valueFormatter`,
 * `emptyLabel`, `className`, `ref`, and native `div` attributes are supported.
 * @param categories - Category labels rendered along the x axis.
 * @param series - Bar series; each entry supplies one value per category.
 * @param stacked - Stacks every series into a single bar per category; defaults to `false`.
 * @param showValues - Draws formatted values next to the bars; defaults to `false`.
 * @example
 * <BarChart
 *     ariaLabel="Quarterly revenue"
 *     categories={["Q1", "Q2", "Q3"]}
 *     series={[
 *         { id: "revenue", label: "Revenue", values: [12, 18, 9] },
 *         { id: "cost", label: "Cost", values: [7, 11, 6] },
 *     ]}
 * />
 */
export interface BarChartProps extends ChartBaseProps {
    categories: readonly string[];
    series: readonly BarChartSeries[];
    stacked?: boolean;
    showValues?: boolean;
}

/**
 * Drawing options handed from the component to the canvas painter.
 * Type: interface.
 * @param categories - Category labels.
 * @param series - Bar series.
 * @param stacked - Whether series are stacked per category.
 * @param showGrid - Whether grid lines are drawn.
 * @param showValues - Whether value labels are drawn.
 * @param valueFormatter - Optional numeric formatter for labels and the data table.
 * @param emptyLabel - Message drawn when the chart has no data.
 * @example
 * const options: BarRenderOptions = {
 *     categories: ["Q1"],
 *     series: [{ id: "revenue", label: "Revenue", values: [12] }],
 *     stacked: false,
 *     showGrid: true,
 *     showValues: true,
 *     emptyLabel: "No data",
 * };
 */
interface BarRenderOptions {
    categories: readonly string[];
    series: readonly BarChartSeries[];
    stacked: boolean;
    showGrid: boolean;
    showValues: boolean;
    valueFormatter?: (value: number) => string;
    emptyLabel: string;
}

/**
 * One value label positioned in chart pixel space.
 * Type: interface.
 * @param text - Formatted value.
 * @param x - Anchor x.
 * @param y - Anchor y.
 * @param baseline - Canvas text baseline.
 * @example
 * const label: BarValueLabel = { text: "12", x: 80, y: 120, baseline: "bottom" };
 */
interface BarValueLabel {
    text: string;
    x: number;
    y: number;
    baseline: ChartTextBaseline;
}

/**
 * Reads a finite value from a series, treating missing entries as zero.
 * @example
 * const value: number = readBarValue([3, 5], 1); // 5
 * @param values - Series values.
 * @param index - Category index.
 * @returns The stored value, or `0` when the entry is missing or non-finite.
 */
const readBarValue: (values: readonly number[], index: number) => number = (
    values: readonly number[],
    index: number,
): number => {
    const value: number | void = values[index];

    return value !== (void 0) && Number.isFinite(value) ? value : 0;
};

/**
 * Resolves the legend colour for one series.
 * The explicit series colour wins, then the supplied palette, then the theme token.
 * @example
 * const color: string = resolveLegendColor(series[0], ["#1976d2"], 0); // "#1976d2"
 * @param entry - Series being coloured.
 * @param palette - Optional custom series colours.
 * @param index - Zero-based series index.
 * @returns CSS colour or theme token for the legend swatch.
 */
const resolveLegendColor: (
    entry: BarChartSeries,
    palette: readonly string[] | void,
    index: number,
) => string = (
    entry: BarChartSeries,
    palette: readonly string[] | void,
    index: number,
): string => {
    if (entry.color !== (void 0)) {
        return entry.color;
    }

    if (palette !== (void 0) && palette.length > 0) {
        return palette[index % palette.length];
    }

    return chartSeriesToken(index);
};

/**
 * Computes the y extent for a grouped or stacked plot, always including zero.
 * @example
 * const extent: readonly [number, number] = resolveBarExtent(3, series, true);
 * @param categoryCount - Number of categories.
 * @param series - Bar series.
 * @param stacked - Whether series are stacked per category.
 * @returns Smallest and largest plotted values, including zero.
 */
const resolveBarExtent: (
    categoryCount: number,
    series: readonly BarChartSeries[],
    stacked: boolean,
) => readonly [number, number] = (
    categoryCount: number,
    series: readonly BarChartSeries[],
    stacked: boolean,
): readonly [number, number] => {
    let min: number = 0;
    let max: number = 0;

    if (stacked) {
        for (let categoryIndex: number = 0; categoryIndex < categoryCount; categoryIndex += 1) {
            let positive: number = 0;
            let negative: number = 0;

            for (const entry of series) {
                const value: number = readBarValue(entry.values, categoryIndex);

                if (value > 0) {
                    positive += value;
                } else if (value < 0) {
                    negative += value;
                }
            }

            min = Math.min(min, negative);
            max = Math.max(max, positive);
        }
    } else {
        for (let categoryIndex: number = 0; categoryIndex < categoryCount; categoryIndex += 1) {
            for (const entry of series) {
                const value: number = readBarValue(entry.values, categoryIndex);

                min = Math.min(min, value);
                max = Math.max(max, value);
            }
        }
    }

    return max === min ? [min, min + 1] : [min, max];
};

/**
 * Draws the collected value labels on the overlay layer.
 * Values sit outside the bar ends so the fill colour never hides them.
 * @example
 * drawValueLabels(surface, [{ text: "12", x: 80, y: 120, baseline: "bottom" }]);
 * @param surface - Chart surface.
 * @param labels - Positioned value labels.
 * @returns Nothing.
 */
const drawValueLabels: (surface: ChartSurface, labels: readonly BarValueLabel[]) => void = (
    surface: ChartSurface,
    labels: readonly BarValueLabel[],
): void => {
    for (const label of labels) {
        surface.text(label.text, label.x, label.y, {
            align: "center",
            baseline: label.baseline,
            color: surface.palette.text,
            font: BarLabelFont,
        });
    }
};

/**
 * Draws grouped bars sharing each category band and collects their value labels.
 * Positive bars grow up from the zero baseline, negative bars grow down from it.
 * @example
 * const labels = drawGroupedBars(surface, band, yScale, baseline, 3, series, true);
 * @param surface - Chart surface.
 * @param band - Category band scale.
 * @param yScale - Maps a value to its pixel y position.
 * @param baseline - Pixel y of the zero baseline.
 * @param categoryCount - Number of categories.
 * @param series - Bar series.
 * @param showValues - Whether value labels are collected.
 * @param formatter - Optional numeric formatter.
 * @returns Value labels to paint after every series rectangle.
 */
const drawGroupedBars: (
    surface: ChartSurface,
    band: ChartBandScale,
    yScale: (value: number) => number,
    baseline: number,
    categoryCount: number,
    series: readonly BarChartSeries[],
    showValues: boolean,
    formatter?: (value: number) => string,
) => readonly BarValueLabel[] = (
    surface: ChartSurface,
    band: ChartBandScale,
    yScale: (value: number) => number,
    baseline: number,
    categoryCount: number,
    series: readonly BarChartSeries[],
    showValues: boolean,
    formatter?: (value: number) => string,
): readonly BarValueLabel[] => {
    const labels: BarValueLabel[] = [];
    const seriesCount: number = Math.max(1, series.length);
    const slot: number = band.bandwidth / seriesCount;
    const gap: number = Math.min(BarMaxGroupGap, slot * 0.2);
    const width: number = Math.max(1, slot - gap);

    for (let seriesIndex: number = 0; seriesIndex < series.length; seriesIndex += 1) {
        const entry: BarChartSeries = series[seriesIndex];
        const color: string = entry.color ?? seriesColor(surface.palette, seriesIndex);
        const rects: ChartBarRect[] = [];

        for (let categoryIndex: number = 0; categoryIndex < categoryCount; categoryIndex += 1) {
            const value: number = readBarValue(entry.values, categoryIndex);
            const valueY: number = yScale(value);
            const center: number = band.position(categoryIndex) + slot * seriesIndex + slot / 2;
            const height: number = Math.abs(valueY - baseline);

            if (height > 0) {
                rects.push({
                    x: center - width / 2,
                    y: value >= 0 ? valueY : baseline,
                    width,
                    height,
                });
            }

            if (!showValues || width < BarMinValueWidth) {
                continue;
            }

            labels.push({
                text: formatChartNumber(value, formatter),
                x: center,
                y: value >= 0 ? valueY - BarValueGap : valueY + BarValueGap,
                baseline: value >= 0 ? "bottom" : "top",
            });
        }

        surface.rects(rects, color);
    }

    return labels;
};

/**
 * Draws stacked bars per category and collects the totals to label.
 * Positive segments stack above the zero baseline and negative segments below it.
 * @example
 * const labels = drawStackedBars(surface, band, yScale, 3, series, true);
 * @param surface - Chart surface.
 * @param band - Category band scale.
 * @param yScale - Maps a value to its pixel y position.
 * @param categoryCount - Number of categories.
 * @param series - Bar series.
 * @param showValues - Whether category totals are collected.
 * @param formatter - Optional numeric formatter.
 * @returns Value labels to paint after every series rectangle.
 */
const drawStackedBars: (
    surface: ChartSurface,
    band: ChartBandScale,
    yScale: (value: number) => number,
    categoryCount: number,
    series: readonly BarChartSeries[],
    showValues: boolean,
    formatter?: (value: number) => string,
) => readonly BarValueLabel[] = (
    surface: ChartSurface,
    band: ChartBandScale,
    yScale: (value: number) => number,
    categoryCount: number,
    series: readonly BarChartSeries[],
    showValues: boolean,
    formatter?: (value: number) => string,
): readonly BarValueLabel[] => {
    const labels: BarValueLabel[] = [];
    const rectsBySeries: ChartBarRect[][] = series.map((): ChartBarRect[] => []);

    for (let categoryIndex: number = 0; categoryIndex < categoryCount; categoryIndex += 1) {
        const x: number = band.position(categoryIndex);
        let positive: number = 0;
        let negative: number = 0;

        for (let seriesIndex: number = 0; seriesIndex < series.length; seriesIndex += 1) {
            const value: number = readBarValue(series[seriesIndex].values, categoryIndex);

            if (value === 0) {
                continue;
            }

            const start: number = value > 0 ? positive : negative;
            const end: number = start + value;
            const startY: number = yScale(start);
            const endY: number = yScale(end);

            rectsBySeries[seriesIndex].push({
                x,
                y: Math.min(startY, endY),
                width: band.bandwidth,
                height: Math.abs(endY - startY),
            });

            if (value > 0) {
                positive = end;
            } else {
                negative = end;
            }
        }

        if (!showValues || band.bandwidth < BarMinValueWidth) {
            continue;
        }

        const center: number = x + band.bandwidth / 2;

        if (positive > 0) {
            labels.push({
                text: formatChartNumber(positive, formatter),
                x: center,
                y: yScale(positive) - BarValueGap,
                baseline: "bottom",
            });
        }

        if (negative < 0) {
            labels.push({
                text: formatChartNumber(negative, formatter),
                x: center,
                y: yScale(negative) + BarValueGap,
                baseline: "top",
            });
        }
    }

    for (let seriesIndex: number = 0; seriesIndex < series.length; seriesIndex += 1) {
        const entry: BarChartSeries = series[seriesIndex];
        const color: string = entry.color ?? seriesColor(surface.palette, seriesIndex);

        surface.rects(rectsBySeries[seriesIndex], color);
    }

    return labels;
};

/**
 * Paints a complete bar chart: bars, value labels, axes, and category labels.
 * Empty categories, series, or values produce the shared empty state instead.
 * @example
 * drawBarChart(surface, {
 *     categories: ["Q1", "Q2"],
 *     series: [{ id: "revenue", label: "Revenue", values: [12, 18] }],
 *     stacked: false,
 *     showGrid: true,
 *     showValues: true,
 *     emptyLabel: "No data",
 * });
 * @param surface - Chart surface supplied by the frame.
 * @param options - Categories, series, and display options.
 * @returns Nothing.
 */
const drawBarChart: (surface: ChartSurface, options: BarRenderOptions) => void = (
    surface: ChartSurface,
    {
        categories,
        series,
        stacked,
        showGrid,
        showValues,
        valueFormatter,
        emptyLabel,
    }: BarRenderOptions,
): void => {
    const hasValues: boolean = series.some(
        (entry: BarChartSeries): boolean =>
            entry.values.some((value: number): boolean => Number.isFinite(value)),
    );

    if (categories.length === 0 || series.length === 0 || !hasValues) {
        drawEmptyState(surface, emptyLabel);
        return;
    }

    const area: ChartArea = createPlotArea(surface.width, surface.height, BarPlotMargin);

    if (area.width <= 0 || area.height <= 0) {
        return;
    }

    const extent: readonly [number, number] = resolveBarExtent(categories.length, series, stacked);
    const domain: readonly [number, number] = niceDomain(extent[0], extent[1], 5);
    const ticks: readonly number[] = niceTicks(domain[0], domain[1], 5);
    const yScale: (value: number) => number = createLinearScale(
        domain[0],
        domain[1],
        area.y + area.height,
        area.y,
    );
    const baseline: number = yScale(0);
    const band: ChartBandScale = createBandScale(
        categories.length,
        area.x,
        area.x + area.width,
        BarBandPadding,
    );
    const labels: readonly BarValueLabel[] = stacked
        ? drawStackedBars(
              surface,
              band,
              yScale,
              categories.length,
              series,
              showValues,
              valueFormatter,
          )
        : drawGroupedBars(
              surface,
              band,
              yScale,
              baseline,
              categories.length,
              series,
              showValues,
              valueFormatter,
          );

    const xLabels: ChartAxisLabel[] = categories.map(
        (category: string, index: number): ChartAxisLabel => ({
            label: category,
            x: band.position(index) + band.bandwidth / 2,
        }),
    );

    drawYAxis(surface, area, ticks, yScale, { showGrid, formatter: valueFormatter });
    drawXAxisLabels(surface, area, xLabels);
    drawAxisLines(surface, area);

    if (domain[0] < 0) {
        surface.line(area.x, baseline, area.x + area.width, baseline, surface.palette.axis, 1);
    }

    drawValueLabels(surface, labels);
};

/**
 * Renders responsive grouped or stacked bars with a legend and an accessible
 * data table. Negative values grow below the zero baseline, and every y domain
 * includes zero so the baseline always exists.
 * @param props - Categories, series, stacking, value labels, and shared chart options.
 * @example
 * <BarChart
 *     ariaLabel="Quarterly revenue"
 *     categories={["Q1", "Q2", "Q3"]}
 *     series={[
 *         { id: "revenue", label: "Revenue", values: [12, 18, 9] },
 *         { id: "cost", label: "Cost", values: [7, 11, 6] },
 *     ]}
 *     showValues
 * />
 * @returns An accessible canvas bar chart.
 */
const BarChart: FC<BarChartProps> = ({
    categories,
    series,
    stacked = false,
    showValues = false,
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
}: BarChartProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedAriaLabel: string = ariaLabel ?? t("barChart");
    const resolvedEmptyLabel: string = emptyLabel ?? t("noData");
    const render: (surface: ChartSurface) => void = useCallback(
        (surface: ChartSurface): void => {
            drawBarChart(surface, {
                categories,
                series,
                stacked,
                showGrid,
                showValues,
                valueFormatter,
                emptyLabel: resolvedEmptyLabel,
            });
        },
        [categories, series, stacked, showGrid, showValues, valueFormatter, resolvedEmptyLabel],
    );
    const legend: readonly ChartLegendItem[] = series.map(
        (entry: BarChartSeries, index: number): ChartLegendItem => ({
            id: entry.id,
            label: entry.label,
            color: resolveLegendColor(entry, palette, index),
        }),
    );
    const headers: readonly string[] = [
        t("category"),
        ...series.map((entry: BarChartSeries): string => entry.label),
    ];
    const rows: readonly (readonly (string | number)[])[] = categories.map(
        (category: string, categoryIndex: number): readonly (string | number)[] => [
            category,
            ...series.map(
                (entry: BarChartSeries): string =>
                    formatChartNumber(readBarValue(entry.values, categoryIndex), valueFormatter),
            ),
        ],
    );

    return (
        <ChartFrame
            {...rest}
            ref={ref}
            ariaLabel={resolvedAriaLabel}
            chartType="bar"
            height={height}
            renderer={renderer}
            renderPriority={renderPriority}
            palette={palette}
            showLegend={showLegend}
            legend={legend}
            className={className}
            table={
                <ChartDataTable
                    caption={resolvedAriaLabel}
                    headers={headers}
                    rows={rows}
                />
            }
            render={render}
        />
    );
};

export default BarChart;
