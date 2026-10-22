import type { FC } from "react";
import {
    BarChart,
    LineChart,
    PieChart,
    ScatterChart,
    type BarChartSeries,
    type LineChartSeries,
    type PieChartDatum,
    type ScatterSeries,
} from "../../../component";
import Demo from "../../Demo";
import "./ChartsPage.css";

const barCategories: readonly string[] = ["Q1", "Q2", "Q3", "Q4"];
const barSeries: readonly BarChartSeries[] = [
    {
        id: "revenue",
        label: "Revenue",
        values: [42, 58, 64, 81],
    },
    {
        id: "costs",
        label: "Costs",
        values: [28, 34, 39, 47],
    },
];
const pieData: readonly PieChartDatum[] = [
    { id: "product", label: "Product", value: 44 },
    { id: "services", label: "Services", value: 28 },
    { id: "support", label: "Support", value: 18 },
    { id: "other", label: "Other", value: 10 },
];
const lineSeries: readonly LineChartSeries[] = [
    {
        id: "desktop",
        label: "Desktop",
        points: [
            { x: 1, y: 22 },
            { x: 2, y: 28 },
            { x: 3, y: 25 },
            { x: 4, y: 36 },
            { x: 5, y: 41 },
            { x: 6, y: 39 },
            { x: 7, y: 48 },
            { x: 8, y: 52 },
            { x: 9, y: 50 },
            { x: 10, y: 58 },
        ],
    },
    {
        id: "mobile",
        label: "Mobile",
        points: [
            { x: 1, y: 12 },
            { x: 2, y: 16 },
            { x: 3, y: 21 },
            { x: 4, y: 24 },
            { x: 5, y: 29 },
            { x: 6, y: 35 },
            { x: 7, y: 38 },
            { x: 8, y: 42 },
            { x: 9, y: 49 },
            { x: 10, y: 55 },
        ],
    },
];
const scatterSeries: readonly ScatterSeries[] = [
    {
        id: "control",
        label: "Control",
        points: [
            { x: 12, y: 18 },
            { x: 18, y: 24 },
            { x: 24, y: 21 },
            { x: 30, y: 32 },
            { x: 36, y: 29 },
            { x: 42, y: 41 },
            { x: 48, y: 46 },
            { x: 54, y: 44 },
        ],
    },
    {
        id: "variant",
        label: "Variant",
        points: [
            { x: 14, y: 28 },
            { x: 20, y: 35 },
            { x: 26, y: 33 },
            { x: 32, y: 46 },
            { x: 38, y: 43 },
            { x: 44, y: 55 },
            { x: 50, y: 61 },
            { x: 56, y: 58 },
        ],
    },
];

const barCode: string = `<BarChart
    ariaLabel="Quarterly revenue and costs"
    categories={["Q1", "Q2", "Q3", "Q4"]}
    series={[
        { id: "revenue", label: "Revenue", values: [42, 58, 64, 81] },
        { id: "costs", label: "Costs", values: [28, 34, 39, 47] },
    ]}
    showValues
    renderer="auto"
    height={300}
/>`;

const pieCode: string = `<PieChart
    ariaLabel="Revenue by segment"
    data={[
        { id: "product", label: "Product", value: 44 },
        { id: "services", label: "Services", value: 28 },
        { id: "support", label: "Support", value: 18 },
        { id: "other", label: "Other", value: 10 },
    ]}
    innerRadius={0.52}
    showPercentages
    height={300}
/>`;

const lineCode: string = `<LineChart
    ariaLabel="Monthly sessions by device"
    series={lineSeries}
    area
    showPoints
    renderPriority="high"
    height={300}
/>`;

const scatterCode: string = `<ScatterChart
    ariaLabel="Conversion by cohort"
    series={scatterSeries}
    pointRadius={4}
    height={300}
/>`;

/**
 * Documents the canvas and WebGL statistical charts.
 * Each chart schedules its redraw through the shared task priority queue and
 * falls back from WebGL to the 2D canvas renderer when needed.
 * @example
 * <ChartsPage />
 * @returns The Charts entry.
 */
const ChartsPage: FC = () => (
    <>
        <Demo
            title="Bar chart"
            description="Grouped or stacked bars on a linear value axis. Rendering is canvas-first, with a WebGL series layer when available."
            code={barCode}
        >
            <div className="charts-page__chart">
                <BarChart
                    ariaLabel="Quarterly revenue and costs"
                    categories={barCategories}
                    series={barSeries}
                    showValues
                    renderer="auto"
                    height={300}
                />
            </div>
        </Demo>

        <Demo
            title="Pie chart"
            description="Pie and donut slices with percentage labels, a legend, and every value mirrored in a visually hidden table."
            code={pieCode}
        >
            <div className="charts-page__chart">
                <PieChart
                    ariaLabel="Revenue by segment"
                    data={pieData}
                    innerRadius={0.52}
                    showPercentages
                    height={300}
                />
            </div>
        </Demo>

        <Demo
            title="Line chart"
            description="Multiple series with optional area fills and point markers. The shared task queue schedules redraws and cancels stale frames."
            code={lineCode}
        >
            <div className="charts-page__chart">
                <LineChart
                    ariaLabel="Monthly sessions by device"
                    series={lineSeries}
                    area
                    showPoints
                    renderPriority="high"
                    height={300}
                />
            </div>
        </Demo>

        <Demo
            title="Scatter chart"
            description="Numeric x and y axes with one circle per observation. The same component chooses a WebGL or 2D canvas series layer."
            code={scatterCode}
        >
            <div className="charts-page__chart">
                <ScatterChart
                    ariaLabel="Conversion by cohort"
                    series={scatterSeries}
                    pointRadius={4}
                    height={300}
                />
            </div>
        </Demo>
    </>
);

export default ChartsPage;
