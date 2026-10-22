import {
    useCallback,
    useEffect,
    useRef,
    type FC,
    type RefCallback,
    type RefObject,
} from "react";
import { task, type TaskPriority, type TaskPromise } from "../../../task";
import cx from "../../foundation/cx";
import useMergedRef from "../../foundation/useMergedRef";
import VisuallyHidden from "../../foundation/VisuallyHidden";
import ChartLegend from "./ChartLegend";
import { resolveChartPalette } from "./palette";
import { createChartSurface } from "./surface";
import "./ChartFrame.css";
import type { ChartFrameProps, ChartSurface } from "./types";

/** Default CSS height of a chart plot. */
const DefaultChartHeight: number = 320;

/** Width used before a container is measurable, and in non-layout environments. */
const FallbackChartWidth: number = 640;

/** Label attached to redraw tasks for scheduler diagnostics. */
const ChartRenderLabel: string = "chart:render";

/**
 * Shared chart chrome: responsive canvases, layer management, task-scheduled
 * redraws, legend, and the screen-reader data table.
 * Type: component.
 * @example
 * <ChartFrame
 *     ariaLabel="Revenue"
 *     chartType="bar"
 *     table={<ChartDataTable caption="Revenue" headers={["Quarter", "Value"]} rows={rows} />}
 *     render={render}
 * />
 * @param props - Frame and render options.
 * @returns A responsive chart surface.
 */
const ChartFrame: FC<ChartFrameProps> = ({
    ariaLabel,
    chartType,
    height = DefaultChartHeight,
    renderer = "auto",
    renderPriority = "high",
    palette,
    showLegend = true,
    legend = [],
    table,
    render,
    onError,
    className = "",
    ref,
    ...rest
}: ChartFrameProps) => {
    const containerRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const plotRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const seriesCanvasRef: RefObject<HTMLCanvasElement | null> =
        useRef<HTMLCanvasElement | null>(null);
    const overlayCanvasRef: RefObject<HTMLCanvasElement | null> =
        useRef<HTMLCanvasElement | null>(null);
    const surfaceRef: RefObject<ChartSurface | null> = useRef<ChartSurface | null>(null);
    const taskRef: RefObject<TaskPromise<void> | null> = useRef<TaskPromise<void> | null>(null);
    const renderRef: RefObject<(surface: ChartSurface) => void> = useRef(render);
    const paletteRef: RefObject<readonly string[] | null> = useRef(palette ?? null);
    const heightRef: RefObject<number> = useRef(height);
    const priorityRef: RefObject<TaskPriority> = useRef(renderPriority);
    const errorRef: RefObject<((error: unknown) => void) | null> = useRef(onError ?? null);
    const sizeRef: RefObject<{ width: number; height: number; dpr: number } | null> =
        useRef<{ width: number; height: number; dpr: number } | null>(null);
    const mergedRef: RefCallback<HTMLDivElement> = useMergedRef(containerRef, ref);

    /**
     * Measures the plot and schedules one redraw through the global task queue.
     * @example
     * scheduleRender();
     * @returns Nothing.
     */
    const scheduleRender: () => void = useCallback((): void => {
        const container: HTMLDivElement | null = containerRef.current;
        const plot: HTMLDivElement | null = plotRef.current;
        const surface: ChartSurface | null = surfaceRef.current;

        if (container === null || plot === null || surface === null) {
            return;
        }

        const rect: DOMRect = plot.getBoundingClientRect();
        const width: number = rect.width > 0 ? rect.width : FallbackChartWidth;
        const targetHeight: number = Math.max(1, heightRef.current);
        const dpr: number = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
        const size: { width: number; height: number; dpr: number } | null = sizeRef.current;

        surface.palette = resolveChartPalette(container, paletteRef.current ?? (void 0));

        if (
            size === null ||
            size.width !== width ||
            size.height !== targetHeight ||
            size.dpr !== dpr
        ) {
            surface.resize(width, targetHeight, dpr);
            sizeRef.current = { width, height: targetHeight, dpr };
        }

        taskRef.current?.cancel();
        taskRef.current = null;

        const pending: TaskPromise<void> = task.schedule(
            (): void => {
                const current: ChartSurface | null = surfaceRef.current;

                if (current === null) {
                    return;
                }

                try {
                    current.begin();
                    renderRef.current(current);
                    current.end();
                    containerRef.current?.setAttribute("data-renderer", current.mode);
                    containerRef.current?.removeAttribute("data-render-error");
                } catch (error: unknown) {
                    containerRef.current?.setAttribute("data-render-error", "true");
                    errorRef.current?.(error);
                }
            },
            { priority: priorityRef.current, label: ChartRenderLabel },
        );

        taskRef.current = pending;
        pending.catch((): void => {});
    }, []);

    useEffect((): (() => void) => {
        const container: HTMLDivElement | null = containerRef.current;
        const seriesCanvas: HTMLCanvasElement | null = seriesCanvasRef.current;
        const overlayCanvas: HTMLCanvasElement | null = overlayCanvasRef.current;
        const plot: HTMLDivElement | null = plotRef.current;

        if (
            container === null ||
            seriesCanvas === null ||
            overlayCanvas === null ||
            plot === null
        ) {
            return (): void => {};
        }

        const surface: ChartSurface | null = createChartSurface(
            seriesCanvas,
            overlayCanvas,
            renderer,
        );

        surfaceRef.current = surface;
        sizeRef.current = null;

        if (surface === null) {
            container.setAttribute("data-renderer", "none");
        } else {
            surface.palette = resolveChartPalette(container, paletteRef.current ?? (void 0));
            container.setAttribute("data-renderer", surface.mode);
        }

        let observer: ResizeObserver | null = null;
        const onResize: () => void = (): void => {
            scheduleRender();
        };

        if (typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(onResize);
            observer.observe(plot);
        }

        window.addEventListener("resize", onResize);
        scheduleRender();

        return (): void => {
            observer?.disconnect();
            window.removeEventListener("resize", onResize);
            taskRef.current?.cancel();
            taskRef.current = null;
            surfaceRef.current?.dispose();
            surfaceRef.current = null;
            sizeRef.current = null;
            container.removeAttribute("data-renderer");
            container.removeAttribute("data-render-error");
        };
    }, [renderer, scheduleRender]);

    useEffect((): void => {
        renderRef.current = render;
        paletteRef.current = palette ?? null;
        heightRef.current = height;
        priorityRef.current = renderPriority;
        errorRef.current = onError ?? null;
        scheduleRender();
    }, [render, palette, height, renderPriority, onError, scheduleRender]);

    return (
        <div
            {...rest}
            ref={mergedRef}
            className={cx("chart-frame", className)}
            data-chart={chartType}
        >
            <div
                ref={plotRef}
                className="chart-frame__plot"
                role="img"
                aria-label={ariaLabel}
                style={{ height }}
            >
                <canvas
                    ref={seriesCanvasRef}
                    className="chart-frame__canvas chart-frame__canvas--series"
                    aria-hidden="true"
                />
                <canvas
                    ref={overlayCanvasRef}
                    className="chart-frame__canvas chart-frame__canvas--overlay"
                    aria-hidden="true"
                />
            </div>
            {showLegend && legend.length > 0 ? <ChartLegend items={legend} /> : null}
            <VisuallyHidden as="div">{table}</VisuallyHidden>
        </div>
    );
};

export default ChartFrame;
