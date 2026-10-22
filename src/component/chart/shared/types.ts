import type { HTMLAttributes, ReactNode, Ref } from "react";
import type { TaskPriority } from "../../../task";

/**
 * Renderer requested by a chart.
 * Type: type alias.
 * Fields: "auto", "canvas", "webgl".
 * @example
 * const renderer: ChartRenderer = "webgl";
 */
export type ChartRenderer = "auto" | "canvas" | "webgl";

/**
 * Renderer actually used by a chart surface.
 * Type: type alias.
 * Fields: "canvas", "webgl".
 * @example
 * const mode: ChartRenderMode = "canvas";
 */
export type ChartRenderMode = "canvas" | "webgl";

/**
 * One point in chart pixel space.
 * Type: interface.
 * Fields: x, y.
 * @example
 * const point: ChartPoint = { x: 12, y: 40 };
 */
export interface ChartPoint {
    x: number;
    y: number;
}

/**
 * Rectangle in chart pixel space, measured from the top-left corner.
 * Type: interface.
 * Fields: x, y, width, height.
 * @example
 * const rect: ChartBarRect = { x: 10, y: 20, width: 24, height: 80 };
 */
export interface ChartBarRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Circle in chart pixel space.
 * Type: interface.
 * Fields: x, y, radius.
 * @example
 * const circle: ChartCircle = { x: 40, y: 50, radius: 4 };
 */
export interface ChartCircle {
    x: number;
    y: number;
    radius: number;
}

/**
 * Donut or pie wedge in chart pixel space.
 * Angles start at 12 o'clock and advance clockwise in radians.
 * Type: interface.
 * Fields: cx, cy, innerRadius, outerRadius, startAngle, endAngle.
 * @example
 * const wedge: ChartWedge = { cx: 100, cy: 100, innerRadius: 0, outerRadius: 80, startAngle: 0, endAngle: Math.PI / 2 };
 */
export interface ChartWedge {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
}

/**
 * Polyline drawn on the series layer.
 * Type: interface.
 * Fields: points, width, color.
 * @example
 * const line: ChartPolyline = { points: [{ x: 0, y: 10 }, { x: 20, y: 4 }], width: 2, color: "#1976d2" };
 */
export interface ChartPolyline {
    points: readonly ChartPoint[];
    width: number;
    color: string;
}

/**
 * Plot rectangle left after margins.
 * Type: interface.
 * Fields: x, y, width, height.
 * @example
 * const area: ChartArea = { x: 56, y: 16, width: 500, height: 260 };
 */
export interface ChartArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Outer spacing around a plot area.
 * Type: interface.
 * Fields: top, right, bottom, left.
 * @example
 * const margin: ChartMargin = { top: 16, right: 16, bottom: 36, left: 56 };
 */
export interface ChartMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/**
 * Resolved colours shared by every chart.
 * Type: interface.
 * Fields: series, text, muted, grid, axis.
 * @example
 * const palette: ChartPalette = resolveChartPalette(host);
 */
export interface ChartPalette {
    /** Series colours; charts cycle through the list. */
    series: readonly string[];
    /** Primary label colour. */
    text: string;
    /** Secondary label colour. */
    muted: string;
    /** Grid line colour. */
    grid: string;
    /** Axis line colour. */
    axis: string;
}

/**
 * Horizontal alignment of canvas text.
 * Type: type alias.
 * Fields: "left", "center", "right".
 * @example
 * const align: ChartTextAlign = "right";
 */
export type ChartTextAlign = "left" | "center" | "right";

/**
 * Vertical alignment of canvas text.
 * Type: type alias.
 * Fields: "top", "middle", "bottom".
 * @example
 * const baseline: ChartTextBaseline = "middle";
 */
export type ChartTextBaseline = "top" | "middle" | "bottom";

/**
 * Canvas text style used by chart labels.
 * Type: interface.
 * Fields: font, color, align, baseline, maxWidth.
 * @example
 * surface.text("Q1", 20, 30, { align: "center", baseline: "middle" });
 */
export interface ChartTextOptions {
    font?: string;
    color?: string;
    align?: ChartTextAlign;
    baseline?: ChartTextBaseline;
    maxWidth?: number;
}

/**
 * Drawing surface handed to every chart render function.
 * Series primitives go to the accelerated bottom layer; line, path, and text go to
 * the crisp canvas overlay above it.
 * Type: interface.
 * Fields: mode, width, height, palette, resize, dispose, clear, begin, end, rects,
 * circles, wedges, polylines, line, path, text, measure.
 * @example
 * const render = (surface: ChartSurface): void => {
 *     surface.rects([{ x: 10, y: 20, width: 24, height: 80 }], "#1976d2");
 *     surface.text("Q1", 22, 112, { align: "center" });
 * };
 */
export interface ChartSurface {
    /** Renderer backing the series layer. */
    mode: ChartRenderMode;
    /** CSS width in pixels. */
    width: number;
    /** CSS height in pixels. */
    height: number;
    /** Colours resolved from the active theme. */
    palette: ChartPalette;
    resize(width: number, height: number, dpr: number): void;
    dispose(): void;
    clear(): void;
    begin(): void;
    end(): void;
    rects(rects: readonly ChartBarRect[], color: string): void;
    circles(circles: readonly ChartCircle[], color: string): void;
    wedges(wedges: readonly ChartWedge[], color: string): void;
    polylines(lines: readonly ChartPolyline[]): void;
    area(points: readonly ChartPoint[], baseline: number, color: string): void;
    line(x1: number, y1: number, x2: number, y2: number, color: string, width?: number): void;
    path(points: readonly ChartPoint[], color: string, width?: number, closed?: boolean): void;
    text(text: string, x: number, y: number, options?: ChartTextOptions): void;
    measure(text: string, options?: ChartTextOptions): number;
}

/**
 * One legend entry.
 * Type: interface.
 * Fields: id, label, color, value.
 * @example
 * const item: ChartLegendItem = { label: "Revenue", color: "#1976d2", value: "42k" };
 */
export interface ChartLegendItem {
    id?: string;
    label: string;
    color: string;
    value?: string;
}

/**
 * Props shared by every chart component.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`,
 * and pointer, mouse, keyboard, and focus handlers are forwarded to the root element.
 * Fields: ariaLabel, height, renderer, renderPriority, palette, showLegend, showGrid,
 * valueFormatter, emptyLabel, className, ref.
 * @example
 * <BarChart ariaLabel="Revenue" height={320} renderer="auto" renderPriority="high" />
 */
export interface ChartBaseProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "onError"> {
    /** Accessible name of the chart; defaults to the component name. */
    ariaLabel?: string;
    /** CSS height of the plot area in pixels; defaults to 320. */
    height?: number;
    /** Renderer preference; `auto` uses WebGL when it is available. */
    renderer?: ChartRenderer;
    /** Task queue used for redraws; defaults to `high`. */
    renderPriority?: TaskPriority;
    /** Series colours; falls back to theme colours when omitted. */
    palette?: readonly string[];
    /** Whether to render the legend; defaults to `true`. */
    showLegend?: boolean;
    /** Whether to render grid lines; defaults to `true`. */
    showGrid?: boolean;
    /** Formats numeric values in labels and the accessible table. */
    valueFormatter?: (value: number) => string;
    /** Message drawn when the chart has no data; defaults to `No data`. */
    emptyLabel?: string;
    /** Called when the chart renderer throws while drawing a frame. */
    onError?: (error: unknown) => void;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Identifies one chart in DOM data attributes and tests.
 * Type: type alias.
 * Fields: "bar", "pie", "line", "scatter".
 */
export type ChartKind = "bar" | "pie" | "line" | "scatter";

/**
 * Props for the shared chart frame.
 * Type: interface.
 * Fields: ariaLabel, chartType, height, renderer, renderPriority, palette, showLegend,
 * legend, table, render, onError, ref.
 * @example
 * <ChartFrame
 *     ariaLabel="Revenue"
 *     chartType="bar"
 *     table={<ChartDataTable caption="Revenue" headers={["Quarter", "Value"]} rows={rows} />}
 *     render={render}
 * />
 */
export interface ChartFrameProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "onError"> {
    ariaLabel: string;
    chartType: ChartKind;
    height?: number;
    renderer?: ChartRenderer;
    renderPriority?: TaskPriority;
    palette?: readonly string[];
    showLegend?: boolean;
    legend?: readonly ChartLegendItem[];
    table: ReactNode;
    render: (surface: ChartSurface) => void;
    onError?: (error: unknown) => void;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
