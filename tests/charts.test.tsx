/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
/* eslint-disable @typescript-eslint/naming-convention -- Fake WebGL constants mirror the DOM API. */
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    BarChart,
    LineChart,
    PieChart,
    ScatterChart,
    type BarChartSeries,
    type LineChartSeries,
    type PieChartDatum,
    type ScatterSeries,
} from "../src/component";
import { task } from "../src/task";

const barCategories: readonly string[] = ["Q1", "Q2"];
const barSeries: readonly BarChartSeries[] = [
    { id: "revenue", label: "Revenue", values: [12, 18] },
    { id: "costs", label: "Costs", values: [7, 11] },
];
const pieData: readonly PieChartDatum[] = [
    { id: "alpha", label: "Alpha", value: 60 },
    { id: "beta", label: "Beta", value: 40 },
];
const lineSeries: readonly LineChartSeries[] = [
    {
        id: "sessions",
        label: "Sessions",
        points: [
            { x: 1, y: 4 },
            { x: 2, y: 9 },
            { x: 3, y: 7 },
        ],
    },
];
const scatterSeries: readonly ScatterSeries[] = [
    {
        id: "control",
        label: "Control",
        points: [
            { x: 1, y: 4 },
            { x: 2, y: 9 },
            { x: 3, y: 7 },
        ],
    },
];

const fillRect = vi.fn();
const arc = vi.fn();
const stroke = vi.fn();
const fillText = vi.fn();
const clearRect = vi.fn();
const drawArrays = vi.fn();
const webglContext = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    DYNAMIC_DRAW: 6,
    BLEND: 7,
    SRC_ALPHA: 8,
    ONE_MINUS_SRC_ALPHA: 9,
    DEPTH_TEST: 10,
    COLOR_BUFFER_BIT: 11,
    TRIANGLES: 12,
    FLOAT: 13,
    createShader: (): object => ({}),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: (): boolean => true,
    getShaderInfoLog: (): string => "",
    deleteShader: vi.fn(),
    createProgram: (): object => ({}),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: (): boolean => true,
    getProgramInfoLog: (): string => "",
    deleteProgram: vi.fn(),
    getAttribLocation: (program: object, name: string): number =>
        name === "a_position" ? 0 : name === "a_color" ? 1 : 2,
    getUniformLocation: (): object => ({}),
    useProgram: vi.fn(),
    bindBuffer: vi.fn(),
    createBuffer: (): object => ({}),
    deleteBuffer: vi.fn(),
    enable: vi.fn(),
    blendFunc: vi.fn(),
    disable: vi.fn(),
    clearColor: vi.fn(),
    viewport: vi.fn(),
    clear: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    uniform2f: vi.fn(),
    uniform1f: vi.fn(),
    drawArrays,
    isContextLost: (): boolean => false,
    getExtension: (): null => null,
} as unknown as WebGLRenderingContext;
const context = {
    canvas: document.createElement("canvas"),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineJoin: "round",
    lineCap: "round",
    font: "12px sans-serif",
    textAlign: "left",
    textBaseline: "alphabetic",
    setTransform: vi.fn(),
    clearRect,
    fillRect,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc,
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke,
    fillText,
    measureText: (text: string): TextMetrics => ({ width: text.length * 7 }) as TextMetrics,
} as unknown as CanvasRenderingContext2D;
let scheduleSpy: ReturnType<typeof vi.spyOn>;

beforeEach((): void => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
        (contextId: string): CanvasRenderingContext2D | null =>
            contextId === "2d" ? context : null,
    );
    scheduleSpy = vi.spyOn(task, "schedule");
});

afterEach((): void => {
    vi.restoreAllMocks();
    fillRect.mockClear();
    arc.mockClear();
    stroke.mockClear();
    fillText.mockClear();
    clearRect.mockClear();
    drawArrays.mockClear();
});

describe("statistical charts", (): void => {
    it("renders a canvas pair, legend, and accessible table per chart", (): void => {
        const { container } = render(
            <div>
                <BarChart categories={barCategories} series={barSeries} />
                <PieChart data={pieData} />
                <LineChart series={lineSeries} />
                <ScatterChart series={scatterSeries} />
            </div>,
        );

        expect(container.querySelectorAll("canvas")).toHaveLength(8);
        expect(container.querySelectorAll("[data-chart]")).toHaveLength(4);
        expect(screen.getAllByRole("img")).toHaveLength(4);
        expect(screen.getAllByRole("table")).toHaveLength(4);
        expect(screen.getAllByText("Revenue").length).toBeGreaterThan(0);
    });

    it("schedules redraws through the task queue and draws on canvas", async (): Promise<void> => {
        const { container } = render(
            <BarChart
                ariaLabel="Quarterly revenue"
                categories={barCategories}
                series={barSeries}
                showValues
            />,
        );

        await waitFor((): void => {
            expect(fillRect).toHaveBeenCalled();
        });
        expect(container.querySelector('[data-renderer="canvas"]')).not.toBeNull();
        expect(scheduleSpy).toHaveBeenCalledWith(
            expect.any(Function),
            expect.objectContaining({ label: "chart:render", priority: "high" }),
        );
        expect(fillText).toHaveBeenCalled();
    });

    it("forwards the render priority to the scheduler", async (): Promise<void> => {
        render(<LineChart series={lineSeries} renderPriority="low" />);

        await waitFor((): void => {
            expect(scheduleSpy).toHaveBeenCalledWith(
                expect.any(Function),
                expect.objectContaining({ priority: "low" }),
            );
        });
    });

    it("falls back to the canvas renderer when WebGL is unavailable", async (): Promise<void> => {
        const { container } = render(
            <PieChart ariaLabel="Share" data={pieData} renderer="webgl" innerRadius={0.5} />,
        );

        await waitFor((): void => {
            expect(arc).toHaveBeenCalled();
        });
        expect(container.querySelector('[data-renderer="canvas"]')).not.toBeNull();
    });

    it("draws line and scatter series", async (): Promise<void> => {
        const { container } = render(
            <div>
                <LineChart series={lineSeries} area showPoints />
                <ScatterChart series={scatterSeries} />
            </div>,
        );

        await waitFor((): void => {
            expect(stroke).toHaveBeenCalled();
            expect(arc).toHaveBeenCalled();
        });
        expect(container.querySelectorAll('[data-renderer="canvas"]')).toHaveLength(2);
    });

    it("uses the WebGL series layer when a context is available", async (): Promise<void> => {
        vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(
            (contextId: string): CanvasRenderingContext2D | WebGLRenderingContext | null =>
                contextId === "webgl" ? webglContext : context,
        );
        const { container } = render(
            <LineChart series={lineSeries} renderer="webgl" showPoints />,
        );

        await waitFor((): void => {
            expect(drawArrays).toHaveBeenCalled();
        });
        expect(container.querySelector('[data-renderer="webgl"]')).not.toBeNull();
        expect(container.querySelector("[data-render-error]")).toBeNull();
    });

    it("draws an empty state when the series is empty", async (): Promise<void> => {
        render(<BarChart categories={[]} series={[]} emptyLabel="Nothing here" />);

        await waitFor((): void => {
            expect(fillText).toHaveBeenCalledWith("Nothing here", expect.any(Number), expect.any(Number));
        });
    });
});
