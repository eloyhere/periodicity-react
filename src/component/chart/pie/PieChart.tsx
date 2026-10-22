import { useCallback, type FC, type ReactNode } from "react";
import ChartDataTable from "../shared/ChartDataTable";
import ChartFrame from "../shared/ChartFrame";
import { drawEmptyState } from "../shared/draw";
import { chartSeriesToken, seriesColor } from "../shared/palette";
import { formatChartNumber, formatChartPercent } from "../shared/scale";
import { useInternational, type InternationalContextValue } from "../../../international";
import type {
    ChartBaseProps,
    ChartLegendItem,
    ChartSurface,
    ChartWedge,
} from "../shared/types";

/** Largest supported donut hole, as a fraction of the outer radius. */
const MaxPieInnerRatio: number = 0.85;

/** One full turn in radians; chart angles start at 12 o'clock and run clockwise. */
const PieFullTurn: number = Math.PI * 2;

/** Smallest slice share that still receives a percentage label. */
const PieLabelMinShare: number = 0.05;

/** Font used by percentage labels drawn over slices. */
const PieLabelFont: string = "11px \"Roboto\", system-ui, sans-serif";

/**
 * One slice in a pie or donut chart.
 * Type: interface.
 * @param id - Stable identifier used for legend keys and data rows.
 * @param label - Name shown in the legend and accessible table.
 * @param value - Slice magnitude; non-finite and non-positive values are ignored.
 * @param color - Optional explicit slice colour; the palette is used when omitted.
 * @example
 * const datum: PieChartDatum = { id: "q1", label: "Q1", value: 42 };
 */
export interface PieChartDatum {
    id: string;
    label: string;
    value: number;
    color?: string;
}

/**
 * Props for the pie chart.
 * Type: interface.
 * Extends the shared chart props; `showGrid` is accepted and ignored because a pie has no grid.
 * @param data - Slices to draw; non-finite and non-positive values are skipped.
 * @param innerRadius - Donut hole as a fraction of the outer radius, clamped to 0..0.85; defaults to 0.
 * @param showPercentages - Whether to draw percentage labels over slices; defaults to `false`.
 * @example
 * <PieChart data={[{ id: "q1", label: "Q1", value: 42 }]} innerRadius={0.6} showPercentages />
 */
export interface PieChartProps extends ChartBaseProps {
    data: readonly PieChartDatum[];
    innerRadius?: number;
    showPercentages?: boolean;
}

/**
 * Positive datum paired with its position in the source array.
 * Type: interface.
 * @param datum - Source slice.
 * @param index - Original index used to cycle palette colours.
 * @example
 * const candidate: PieCandidate = { datum, index: 0 };
 */
interface PieCandidate {
    datum: PieChartDatum;
    index: number;
}

/**
 * Positive slice enriched with its share and drawing angles.
 * Type: interface.
 * @param datum - Source slice.
 * @param index - Original index used to cycle palette colours.
 * @param share - Fraction of the positive total in the 0..1 range.
 * @param startAngle - Start angle in radians, measured clockwise from 12 o'clock.
 * @param endAngle - End angle in radians, measured clockwise from 12 o'clock.
 * @example
 * const slice: PieSlice = { datum, index: 0, share: 0.4, startAngle: 0, endAngle: 2.51 };
 */
interface PieSlice {
    datum: PieChartDatum;
    index: number;
    share: number;
    startAngle: number;
    endAngle: number;
}

/**
 * Drawing options handed from the component to the canvas painter.
 * Type: interface.
 * @param data - Source slices; non-finite and non-positive values are ignored.
 * @param innerRatio - Clamped donut hole as a fraction of the outer radius.
 * @param showPercentages - Whether percentage labels are drawn over slices.
 * @param emptyLabel - Message drawn when no drawable slice exists.
 * @example
 * const options: PieRenderOptions = { data, innerRatio: 0.6, showPercentages: true, emptyLabel: "No data" };
 */
interface PieRenderOptions {
    data: readonly PieChartDatum[];
    innerRatio: number;
    showPercentages: boolean;
    emptyLabel: string;
}

/**
 * Clamps the requested donut hole ratio into the supported 0..0.85 range.
 * @example
 * const ratio: number = resolvePieInnerRatio(1.4); // 0.85
 * @param innerRadius - Requested hole size as a fraction of the outer radius.
 * @returns Clamped ratio; non-finite input becomes 0.
 */
const resolvePieInnerRatio: (innerRadius?: number) => number = (
    innerRadius?: number,
): number => {
    if (innerRadius === (void 0) || !Number.isFinite(innerRadius)) {
        return 0;
    }

    return Math.min(MaxPieInnerRatio, Math.max(0, innerRadius));
};

/**
 * Keeps positive, finite slices and assigns each its share and angles.
 * @example
 * const slices: readonly PieSlice[] = buildPieSlices(data);
 * @param data - Source slices.
 * @returns Slices in source order, or an empty list when no positive values exist.
 */
const buildPieSlices: (data: readonly PieChartDatum[]) => readonly PieSlice[] = (
    data: readonly PieChartDatum[],
): readonly PieSlice[] => {
    const candidates: PieCandidate[] = [];
    let total: number = 0;

    for (let index: number = 0; index < data.length; index += 1) {
        const datum: PieChartDatum = data[index];

        if (!Number.isFinite(datum.value) || datum.value <= 0) {
            continue;
        }

        candidates.push({ datum, index });
        total += datum.value;
    }

    if (candidates.length === 0 || !Number.isFinite(total) || total <= 0) {
        return [];
    }

    const slices: PieSlice[] = [];
    let cumulative: number = 0;

    for (const candidate of candidates) {
        const startAngle: number = (cumulative / total) * PieFullTurn;

        cumulative += candidate.datum.value;

        slices.push({
            datum: candidate.datum,
            index: candidate.index,
            share: candidate.datum.value / total,
            startAngle,
            endAngle: (cumulative / total) * PieFullTurn,
        });
    }

    return slices;
};

/**
 * Paints a complete pie or donut chart, or the shared empty state.
 * Series wedges are drawn first, then percentage labels on top.
 * @example
 * drawPieChart(surface, { data, innerRatio: 0.6, showPercentages: true, emptyLabel: "No data" });
 * @param surface - Chart surface supplied by the frame.
 * @param options - Slices, donut hole, labels, and empty message.
 * @returns Nothing.
 */
const drawPieChart: (surface: ChartSurface, options: PieRenderOptions) => void = (
    surface: ChartSurface,
    { data, innerRatio, showPercentages, emptyLabel }: PieRenderOptions,
): void => {
    const slices: readonly PieSlice[] = buildPieSlices(data);

    if (slices.length === 0) {
        drawEmptyState(surface, emptyLabel);
        return;
    }

    const outerRadius: number = Math.max(0, Math.min(surface.width, surface.height) / 2 - 12);
    const centreX: number = surface.width / 2;
    const centreY: number = surface.height / 2;
    const holeRadius: number = outerRadius * innerRatio;

    for (const slice of slices) {
        const wedge: ChartWedge = {
            cx: centreX,
            cy: centreY,
            innerRadius: holeRadius,
            outerRadius,
            startAngle: slice.startAngle,
            endAngle: slice.endAngle,
        };

        surface.wedges(
            [wedge],
            slice.datum.color ?? seriesColor(surface.palette, slice.index),
        );
    }

    if (!showPercentages) {
        return;
    }

    const labelRadius: number = (outerRadius + holeRadius) / 2;

    for (const slice of slices) {
        if (slice.share < PieLabelMinShare) {
            continue;
        }

        const angle: number = (slice.startAngle + slice.endAngle) / 2;

        surface.text(
            formatChartPercent(slice.share),
            centreX + Math.sin(angle) * labelRadius,
            centreY - Math.cos(angle) * labelRadius,
            {
                align: "center",
                baseline: "middle",
                color: surface.palette.text,
                font: PieLabelFont,
            },
        );
    }
};

/**
 * Renders a pie or donut chart with an optional legend, percentage labels, and a
 * screen-reader data table.
 * Type: component.
 * @param props - Slices and shared chart options.
 * @example
 * <PieChart data={[{ id: "q1", label: "Q1", value: 42 }]} innerRadius={0.6} showPercentages />
 * @returns A responsive pie chart.
 */
const PieChart: FC<PieChartProps> = (props: PieChartProps) => {
    const { t }: InternationalContextValue = useInternational();
    const {
        ariaLabel,
        data,
        innerRadius = 0,
        showPercentages = false,
        showGrid,
        height,
        renderer,
        renderPriority,
        palette,
        showLegend = true,
        valueFormatter,
        emptyLabel,
        className,
        ref,
        ...rest
    }: PieChartProps = props;

    void showGrid;

    const resolvedAriaLabel: string = ariaLabel ?? t("pieChart");
    const resolvedEmptyLabel: string = emptyLabel ?? t("noData");
    const slices: readonly PieSlice[] = buildPieSlices(data);
    const innerRatio: number = resolvePieInnerRatio(innerRadius);
    const formatValue: (value: number) => string = valueFormatter ?? formatChartNumber;
    const legend: readonly ChartLegendItem[] = slices.map(
        (slice: PieSlice): ChartLegendItem => ({
            id: slice.datum.id,
            label: slice.datum.label,
            color:
                slice.datum.color ??
                palette?.[slice.index % palette.length] ??
                chartSeriesToken(slice.index),
            value: formatChartPercent(slice.share),
        }),
    );
    const rows: readonly (readonly (string | number)[])[] = slices.map(
        (slice: PieSlice): readonly (string | number)[] => [
            slice.datum.label,
            formatValue(slice.datum.value),
            formatChartPercent(slice.share, 1),
        ],
    );
    const table: ReactNode = (
        <ChartDataTable
            caption={resolvedAriaLabel}
            headers={[t("labelHeader"), t("value"), t("share")]}
            rows={rows}
        />
    );
    const render: (surface: ChartSurface) => void = useCallback(
        (surface: ChartSurface): void => {
            drawPieChart(surface, {
                data,
                innerRatio,
                showPercentages,
                emptyLabel: resolvedEmptyLabel,
            });
        },
        [data, innerRatio, showPercentages, resolvedEmptyLabel],
    );

    return (
        <ChartFrame
            {...rest}
            ref={ref}
            ariaLabel={resolvedAriaLabel}
            chartType="pie"
            height={height}
            renderer={renderer}
            renderPriority={renderPriority}
            palette={palette}
            showLegend={showLegend}
            className={className}
            legend={legend}
            table={table}
            render={render}
        />
    );
};

export default PieChart;
