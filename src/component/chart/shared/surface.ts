import { parseChartColor } from "./color";
import { FallbackChartPalette } from "./palette";
import type {
    ChartBarRect,
    ChartCircle,
    ChartPalette,
    ChartPoint,
    ChartPolyline,
    ChartRenderMode,
    ChartRenderer,
    ChartSurface,
    ChartTextOptions,
    ChartWedge,
} from "./types";

/** Default canvas font used by chart labels. */
export const DefaultChartFont: string = "12px \"Roboto\", system-ui, sans-serif";

/** Vertex stride in floats: x, y, r, g, b, a, u, v. */
const VertexStride: number = 8;

/** Vertex stride in bytes. */
const VertexStrideBytes: number = VertexStride * 4;

/** Clockwise wedge resolution target in radians per segment. */
const WedgeSegmentAngle: number = Math.PI / 48;

/**
 * Compiled WebGL resources used by the series layer.
 * Type: interface.
 * Fields: gl, program, buffer, position, color, uv, resolution, shape.
 */
interface WebGLResources {
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    buffer: WebGLBuffer;
    position: number;
    color: number;
    uv: number;
    resolution: WebGLUniformLocation;
    shape: WebGLUniformLocation;
}

/**
 * Compiles one shader, throwing when compilation fails.
 * @example
 * const shader: WebGLShader = compileChartShader(gl, gl.VERTEX_SHADER, source);
 * @param gl - WebGL context.
 * @param type - Shader stage.
 * @param source - GLSL source.
 * @returns Compiled shader.
 */
const compileChartShader: (
    gl: WebGLRenderingContext,
    type: number,
    source: string,
) => WebGLShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader => {
    const shader: WebGLShader | null = gl.createShader(type);

    if (shader === null) {
        throw new Error("Chart WebGL shader allocation failed.");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
        const log: string = gl.getShaderInfoLog(shader) ?? "Chart WebGL shader compilation failed.";
        gl.deleteShader(shader);
        throw new Error(log);
    }

    return shader;
};

/**
 * Builds the WebGL program, buffer, and attribute locations.
 * @example
 * const resources: WebGLResources = createWebGLResources(gl);
 * @param gl - WebGL context.
 * @returns Compiled resources.
 */
const createWebGLResources: (gl: WebGLRenderingContext) => WebGLResources = (
    gl: WebGLRenderingContext,
): WebGLResources => {
    const vertexSource: string = [
        "attribute vec2 a_position;",
        "attribute vec4 a_color;",
        "attribute vec2 a_uv;",
        "uniform vec2 u_resolution;",
        "varying vec4 v_color;",
        "varying vec2 v_uv;",
        "void main() {",
        "    vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;",
        "    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);",
        "    v_color = a_color;",
        "    v_uv = a_uv;",
        "}",
    ].join("\n");
    const fragmentSource: string = [
        "precision mediump float;",
        "varying vec4 v_color;",
        "varying vec2 v_uv;",
        "uniform float u_shape;",
        "void main() {",
        "    vec4 color = v_color;",
        "    if (u_shape > 0.5) {",
        "        float distance = length(v_uv);",
        "        if (distance > 1.0) {",
        "            discard;",
        "        }",
        "        color.a *= 1.0 - smoothstep(0.86, 1.0, distance);",
        "    }",
        "    gl_FragColor = color;",
        "}",
    ].join("\n");
    const vertex: WebGLShader = compileChartShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment: WebGLShader = compileChartShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program: WebGLProgram | null = gl.createProgram();

    if (program === null) {
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        throw new Error("Chart WebGL program allocation failed.");
    }

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
        const log: string = gl.getProgramInfoLog(program) ?? "Chart WebGL linking failed.";
        gl.deleteProgram(program);
        throw new Error(log);
    }

    const position: number = gl.getAttribLocation(program, "a_position");
    const color: number = gl.getAttribLocation(program, "a_color");
    const uv: number = gl.getAttribLocation(program, "a_uv");
    const resolution: WebGLUniformLocation | null = gl.getUniformLocation(program, "u_resolution");
    const shape: WebGLUniformLocation | null = gl.getUniformLocation(program, "u_shape");
    const buffer: WebGLBuffer | null = gl.createBuffer();

    if (
        position < 0 ||
        color < 0 ||
        uv < 0 ||
        resolution === null ||
        shape === null ||
        buffer === null
    ) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        throw new Error("Chart WebGL locations are unavailable.");
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    return { gl, program, buffer, position, color, uv, resolution, shape };
};

/**
 * Converts a chart angle (0 at 12 o'clock, clockwise) to a pixel point.
 * @example
 * const point: ChartPoint = wedgePoint(100, 100, 40, Math.PI / 2);
 * @param cx - Centre x.
 * @param cy - Centre y.
 * @param radius - Radius.
 * @param angle - Chart angle in radians.
 * @returns Point on the circle.
 */
const wedgePoint: (
    cx: number,
    cy: number,
    radius: number,
    angle: number,
) => ChartPoint = (cx: number, cy: number, radius: number, angle: number): ChartPoint => ({
    x: cx + Math.sin(angle) * radius,
    y: cy - Math.cos(angle) * radius,
});

/**
 * Canvas and WebGL implementation of {@link ChartSurface}.
 * Type: class.
 * @example
 * const surface = createChartSurface(seriesCanvas, overlayCanvas, "auto");
 */
class ChartSurfaceImpl implements ChartSurface {
    public mode: ChartRenderMode;
    public width: number = 0;
    public height: number = 0;
    public palette: ChartPalette = FallbackChartPalette;
    private readonly seriesCanvas: HTMLCanvasElement;
    private readonly overlayCanvas: HTMLCanvasElement;
    private readonly series2d: CanvasRenderingContext2D | null;
    private readonly overlay2d: CanvasRenderingContext2D;
    private readonly resources: WebGLResources | null;
    private pendingTriangles: number[] = [];
    private pendingCircles: number[] = [];

    /**
     * Creates a surface around existing canvases.
     * @example
     * const surface = new ChartSurfaceImpl(seriesCanvas, overlayCanvas, series2d, overlay2d, gl);
     * @param seriesCanvas - Bottom canvas.
     * @param overlayCanvas - Top canvas.
     * @param series2d - 2D context of the bottom canvas, or the overlay context when sharing.
     * @param overlay2d - 2D context of the top canvas.
     * @param gl - WebGL context, or null for canvas rendering.
     * @returns A chart surface.
     */
    public constructor(
        seriesCanvas: HTMLCanvasElement,
        overlayCanvas: HTMLCanvasElement,
        series2d: CanvasRenderingContext2D | null,
        overlay2d: CanvasRenderingContext2D,
        gl: WebGLRenderingContext | null,
    ) {
        this.seriesCanvas = seriesCanvas;
        this.overlayCanvas = overlayCanvas;
        this.series2d = series2d;
        this.overlay2d = overlay2d;
        this.resources = gl === null ? null : createWebGLResources(gl);
        this.mode = gl === null ? "canvas" : "webgl";
    }

    /**
     * Resizes both canvases for the current CSS size and device pixel ratio.
     * @example
     * surface.resize(640, 320, window.devicePixelRatio);
     * @param width - CSS width.
     * @param height - CSS height.
     * @param dpr - Device pixel ratio.
     * @returns Nothing.
     */
    public resize(width: number, height: number, dpr: number): void {
        this.width = Math.max(1, width);
        this.height = Math.max(1, height);
        const ratio: number = Math.max(1, dpr);
        const pixelWidth: number = Math.max(1, Math.round(this.width * ratio));
        const pixelHeight: number = Math.max(1, Math.round(this.height * ratio));

        this.seriesCanvas.width = pixelWidth;
        this.seriesCanvas.height = pixelHeight;
        this.overlayCanvas.width = pixelWidth;
        this.overlayCanvas.height = pixelHeight;
        this.series2d?.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.overlay2d.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.resources?.gl.viewport(0, 0, pixelWidth, pixelHeight);
    }

    /**
     * Releases WebGL resources.
     * @example
     * surface.dispose();
     * @returns Nothing.
     */
    public dispose(): void {
        if (this.resources !== null) {
            this.resources.gl.deleteBuffer(this.resources.buffer);
            this.resources.gl.deleteProgram(this.resources.program);
        }

        this.pendingTriangles = [];
        this.pendingCircles = [];
    }

    /**
     * Clears both layers.
     * @example
     * surface.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.series2d?.clearRect(0, 0, this.width, this.height);

        if (this.overlay2d !== this.series2d) {
            this.overlay2d.clearRect(0, 0, this.width, this.height);
        }

        if (this.resources !== null) {
            const gl: WebGLRenderingContext = this.resources.gl;

            if (!gl.isContextLost()) {
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        }
    }

    /**
     * Starts a frame by clearing the layers and pending geometry.
     * @example
     * surface.begin();
     * @returns Nothing.
     */
    public begin(): void {
        this.clear();
        this.pendingTriangles = [];
        this.pendingCircles = [];
    }

    /**
     * Finishes a frame by flushing WebGL geometry.
     * @example
     * surface.end();
     * @returns Nothing.
     */
    public end(): void {
        this.flush();
    }

    /**
     * Draws rectangles on the series layer.
     * @example
     * surface.rects([{ x: 10, y: 20, width: 24, height: 80 }], "#1976d2");
     * @param rects - Rectangles.
     * @param color - Fill colour.
     * @returns Nothing.
     */
    public rects(rects: readonly ChartBarRect[], color: string): void {
        if (rects.length === 0) {
            return;
        }

        if (this.resources !== null) {
            const rgba: readonly [number, number, number, number] = parseChartColor(
                this.normalizeColor(color),
            );

            for (const rect of rects) {
                if (rect.width <= 0 || rect.height <= 0) {
                    continue;
                }

                const topLeft: ChartPoint = { x: rect.x, y: rect.y };
                const topRight: ChartPoint = { x: rect.x + rect.width, y: rect.y };
                const bottomRight: ChartPoint = {
                    x: rect.x + rect.width,
                    y: rect.y + rect.height,
                };
                const bottomLeft: ChartPoint = { x: rect.x, y: rect.y + rect.height };

                this.pushQuad(this.pendingTriangles, topLeft, topRight, bottomRight, bottomLeft, rgba);
            }

            return;
        }

        const context: CanvasRenderingContext2D | null = this.series2d;

        if (context === null) {
            return;
        }

        context.fillStyle = color;

        for (const rect of rects) {
            if (rect.width > 0 && rect.height > 0) {
                context.fillRect(rect.x, rect.y, rect.width, rect.height);
            }
        }
    }

    /**
     * Draws circles on the series layer.
     * @example
     * surface.circles([{ x: 40, y: 50, radius: 4 }], "#1976d2");
     * @param circles - Circles.
     * @param color - Fill colour.
     * @returns Nothing.
     */
    public circles(circles: readonly ChartCircle[], color: string): void {
        if (circles.length === 0) {
            return;
        }

        if (this.resources !== null) {
            const rgba: readonly [number, number, number, number] = parseChartColor(
                this.normalizeColor(color),
            );

            for (const circle of circles) {
                if (circle.radius <= 0) {
                    continue;
                }

                this.pushCircle(this.pendingCircles, circle.x, circle.y, circle.radius, rgba);
            }

            return;
        }

        const context: CanvasRenderingContext2D | null = this.series2d;

        if (context === null) {
            return;
        }

        context.fillStyle = color;
        context.beginPath();

        for (const circle of circles) {
            if (circle.radius > 0) {
                context.moveTo(circle.x + circle.radius, circle.y);
                context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
            }
        }

        context.fill();
    }

    /**
     * Draws pie and donut wedges on the series layer.
     * @example
     * surface.wedges([{ cx: 100, cy: 100, innerRadius: 0, outerRadius: 80, startAngle: 0, endAngle: Math.PI / 2 }], "#1976d2");
     * @param wedges - Wedges.
     * @param color - Fill colour.
     * @returns Nothing.
     */
    public wedges(wedges: readonly ChartWedge[], color: string): void {
        if (wedges.length === 0) {
            return;
        }

        if (this.resources !== null) {
            const rgba: readonly [number, number, number, number] = parseChartColor(
                this.normalizeColor(color),
            );

            for (const wedge of wedges) {
                this.pushWedge(wedge, rgba);
            }

            return;
        }

        const context: CanvasRenderingContext2D | null = this.series2d;

        if (context === null) {
            return;
        }

        context.fillStyle = color;

        for (const wedge of wedges) {
            const span: number = Math.abs(wedge.endAngle - wedge.startAngle);

            if (wedge.outerRadius <= 0 || span <= 0) {
                continue;
            }

            context.beginPath();

            if (wedge.innerRadius <= 0) {
                context.moveTo(wedge.cx, wedge.cy);
                context.arc(
                    wedge.cx,
                    wedge.cy,
                    wedge.outerRadius,
                    wedge.startAngle - Math.PI / 2,
                    wedge.endAngle - Math.PI / 2,
                );
            } else {
                context.arc(
                    wedge.cx,
                    wedge.cy,
                    wedge.outerRadius,
                    wedge.startAngle - Math.PI / 2,
                    wedge.endAngle - Math.PI / 2,
                );
                context.arc(
                    wedge.cx,
                    wedge.cy,
                    wedge.innerRadius,
                    wedge.endAngle - Math.PI / 2,
                    wedge.startAngle - Math.PI / 2,
                    true,
                );
            }

            context.closePath();
            context.fill();
        }
    }

    /**
     * Draws stroked polylines on the series layer.
     * @example
     * surface.polylines([{ points: [{ x: 0, y: 10 }, { x: 20, y: 4 }], width: 2, color: "#1976d2" }]);
     * @param lines - Polylines.
     * @returns Nothing.
     */
    public polylines(lines: readonly ChartPolyline[]): void {
        if (lines.length === 0) {
            return;
        }

        if (this.resources !== null) {
            for (const line of lines) {
                if (line.points.length === 0) {
                    continue;
                }

                const rgba: readonly [number, number, number, number] = parseChartColor(
                    this.normalizeColor(line.color),
                );
                const half: number = Math.max(0.5, line.width / 2);

                for (let index: number = 1; index < line.points.length; index += 1) {
                    this.pushSegment(line.points[index - 1], line.points[index], half, rgba);
                }

                for (const point of line.points) {
                    this.pushCircle(this.pendingCircles, point.x, point.y, half, rgba);
                }
            }

            return;
        }

        const context: CanvasRenderingContext2D | null = this.series2d;

        if (context === null) {
            return;
        }

        for (const line of lines) {
            if (line.points.length === 0) {
                continue;
            }

            context.strokeStyle = line.color;
            context.lineWidth = Math.max(0.5, line.width);
            context.lineJoin = "round";
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(line.points[0].x, line.points[0].y);

            for (let index: number = 1; index < line.points.length; index += 1) {
                context.lineTo(line.points[index].x, line.points[index].y);
            }

            context.stroke();
        }
    }

    /**
     * Fills the area between a polyline and a baseline on the series layer.
     * @example
     * surface.area([{ x: 0, y: 10 }, { x: 20, y: 4 }], 300, "rgba(25, 118, 210, 0.2)");
     * @param points - Top edge of the area.
     * @param baseline - Pixel y of the filled base.
     * @param color - Fill colour.
     * @returns Nothing.
     */
    public area(points: readonly ChartPoint[], baseline: number, color: string): void {
        if (points.length < 2) {
            return;
        }

        if (this.resources !== null) {
            const rgba: readonly [number, number, number, number] = parseChartColor(
                this.normalizeColor(color),
            );

            for (let index: number = 1; index < points.length; index += 1) {
                const previous: ChartPoint = points[index - 1];
                const current: ChartPoint = points[index];
                this.pushQuad(
                    this.pendingTriangles,
                    previous,
                    current,
                    { x: current.x, y: baseline },
                    { x: previous.x, y: baseline },
                    rgba,
                );
            }

            return;
        }

        const context: CanvasRenderingContext2D | null = this.series2d;

        if (context === null) {
            return;
        }

        context.fillStyle = color;
        context.beginPath();
        context.moveTo(points[0].x, baseline);
        context.lineTo(points[0].x, points[0].y);

        for (let index: number = 1; index < points.length; index += 1) {
            context.lineTo(points[index].x, points[index].y);
        }

        context.lineTo(points[points.length - 1].x, baseline);
        context.closePath();
        context.fill();
    }

    /**
     * Draws one overlay line.
     * @example
     * surface.line(10, 20, 100, 20, "#444", 1);
     * @param x1 - Start x.
     * @param y1 - Start y.
     * @param x2 - End x.
     * @param y2 - End y.
     * @param color - Stroke colour.
     * @param width - Stroke width.
     * @returns Nothing.
     */
    public line(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        width: number = 1,
    ): void {
        this.overlay2d.strokeStyle = color;
        this.overlay2d.lineWidth = Math.max(0.5, width);
        this.overlay2d.beginPath();
        this.overlay2d.moveTo(x1, y1);
        this.overlay2d.lineTo(x2, y2);
        this.overlay2d.stroke();
    }

    /**
     * Draws one stroked overlay path.
     * @example
     * surface.path([{ x: 10, y: 20 }, { x: 40, y: 10 }], "#444");
     * @param points - Path points.
     * @param color - Stroke colour.
     * @param width - Stroke width.
     * @param closed - Whether to close the path.
     * @returns Nothing.
     */
    public path(
        points: readonly ChartPoint[],
        color: string,
        width: number = 1,
        closed: boolean = false,
    ): void {
        if (points.length < 2) {
            return;
        }

        this.overlay2d.strokeStyle = color;
        this.overlay2d.lineWidth = Math.max(0.5, width);
        this.overlay2d.lineJoin = "round";
        this.overlay2d.lineCap = "round";
        this.overlay2d.beginPath();
        this.overlay2d.moveTo(points[0].x, points[0].y);

        for (let index: number = 1; index < points.length; index += 1) {
            this.overlay2d.lineTo(points[index].x, points[index].y);
        }

        if (closed) {
            this.overlay2d.closePath();
        }

        this.overlay2d.stroke();
    }

    /**
     * Draws text on the overlay layer.
     * @example
     * surface.text("Q1", 80, 300, { align: "center", baseline: "top" });
     * @param text - Text content.
     * @param x - Anchor x.
     * @param y - Anchor y.
     * @param options - Font, colour, alignment, and max width.
     * @returns Nothing.
     */
    public text(text: string, x: number, y: number, options?: ChartTextOptions): void {
        this.overlay2d.font = options?.font ?? DefaultChartFont;
        this.overlay2d.fillStyle = options?.color ?? this.palette.text;
        this.overlay2d.textAlign = options?.align ?? "left";
        this.overlay2d.textBaseline = options?.baseline ?? "alphabetic";

        if (options?.maxWidth === (void 0)) {
            this.overlay2d.fillText(text, x, y);
        } else {
            this.overlay2d.fillText(text, x, y, options.maxWidth);
        }
    }

    /**
     * Measures text with the same font used by {@link text}.
     * @example
     * const width: number = surface.measure("Q1");
     * @param text - Text content.
     * @param options - Font options.
     * @returns Width in CSS pixels.
     */
    public measure(text: string, options?: ChartTextOptions): number {
        this.overlay2d.font = options?.font ?? DefaultChartFont;

        return this.overlay2d.measureText(text).width;
    }

    /**
     * Normalizes a CSS colour through the 2D context so WebGL receives a concrete
     * colour. Canvas understands named colours, hsl(), and other CSS colour syntax,
     * while {@link parseChartColor} intentionally supports only the common forms.
     * @example
     * const color: string = surface.normalizeColor("hsl(210 80% 50%)");
     * @param color - CSS colour string.
     * @returns Concrete CSS colour, or the original value when it cannot be parsed.
     */
    private normalizeColor(color: string): string {
        this.overlay2d.fillStyle = "#000000";
        this.overlay2d.fillStyle = color;
        const normalized: string | CanvasGradient | CanvasPattern = this.overlay2d.fillStyle;

        return typeof normalized === "string" ? normalized : color;
    }

    /**
     * Uploads and draws pending WebGL vertices.
     * @example
     * surface.end();
     * @returns Nothing.
     */
    private flush(): void {
        const resources: WebGLResources | null = this.resources;

        if (resources === null) {
            return;
        }

        const gl: WebGLRenderingContext = resources.gl;
        const triangleVertices: number = this.pendingTriangles.length / VertexStride;
        const circleVertices: number = this.pendingCircles.length / VertexStride;
        const totalVertices: number = triangleVertices + circleVertices;

        if (totalVertices === 0 || gl.isContextLost()) {
            this.pendingTriangles = [];
            this.pendingCircles = [];
            return;
        }

        const data: Float32Array = new Float32Array(this.pendingTriangles.length + this.pendingCircles.length);
        data.set(this.pendingTriangles, 0);
        data.set(this.pendingCircles, this.pendingTriangles.length);

        gl.useProgram(resources.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(resources.position);
        gl.enableVertexAttribArray(resources.color);
        gl.enableVertexAttribArray(resources.uv);
        gl.vertexAttribPointer(resources.position, 2, gl.FLOAT, false, VertexStrideBytes, 0);
        gl.vertexAttribPointer(resources.color, 4, gl.FLOAT, false, VertexStrideBytes, 2 * 4);
        gl.vertexAttribPointer(resources.uv, 2, gl.FLOAT, false, VertexStrideBytes, 6 * 4);
        gl.uniform2f(resources.resolution, this.width, this.height);
        gl.uniform1f(resources.shape, 0);
        gl.drawArrays(gl.TRIANGLES, 0, triangleVertices);

        if (circleVertices > 0) {
            gl.uniform1f(resources.shape, 1);
            gl.drawArrays(gl.TRIANGLES, triangleVertices, circleVertices);
        }

        this.pendingTriangles = [];
        this.pendingCircles = [];
    }

    /**
     * Appends a quad as two triangles.
     * @param target - Vertex array.
     * @param a - First corner.
     * @param b - Second corner.
     * @param c - Third corner.
     * @param d - Fourth corner.
     * @param rgba - Colour channels.
     * @param uvs - Optional per-corner UV coordinates.
     * @returns Nothing.
     */
    private pushQuad(
        target: number[],
        a: ChartPoint,
        b: ChartPoint,
        c: ChartPoint,
        d: ChartPoint,
        rgba: readonly [number, number, number, number],
        uvs?: readonly [ChartPoint, ChartPoint, ChartPoint, ChartPoint],
    ): void {
        const uvA: ChartPoint = uvs?.[0] ?? { x: 0, y: 0 };
        const uvB: ChartPoint = uvs?.[1] ?? { x: 0, y: 0 };
        const uvC: ChartPoint = uvs?.[2] ?? { x: 0, y: 0 };
        const uvD: ChartPoint = uvs?.[3] ?? { x: 0, y: 0 };

        this.pushVertex(target, a, rgba, uvA);
        this.pushVertex(target, b, rgba, uvB);
        this.pushVertex(target, c, rgba, uvC);
        this.pushVertex(target, a, rgba, uvA);
        this.pushVertex(target, c, rgba, uvC);
        this.pushVertex(target, d, rgba, uvD);
    }

    /**
     * Appends one circle as a UV-mapped quad.
     * @param target - Circle vertex array.
     * @param cx - Centre x.
     * @param cy - Centre y.
     * @param radius - Radius.
     * @param rgba - Colour channels.
     * @returns Nothing.
     */
    private pushCircle(
        target: number[],
        cx: number,
        cy: number,
        radius: number,
        rgba: readonly [number, number, number, number],
    ): void {
        const left: number = cx - radius;
        const right: number = cx + radius;
        const top: number = cy - radius;
        const bottom: number = cy + radius;

        this.pushQuad(
            target,
            { x: left, y: top },
            { x: right, y: top },
            { x: right, y: bottom },
            { x: left, y: bottom },
            rgba,
            [
                { x: -1, y: -1 },
                { x: 1, y: -1 },
                { x: 1, y: 1 },
                { x: -1, y: 1 },
            ],
        );
    }

    /**
     * Appends one thick line segment as a quad, with round joins drawn as circles.
     * @param from - Start point.
     * @param to - End point.
     * @param halfWidth - Half of the stroke width.
     * @param rgba - Colour channels.
     * @returns Nothing.
     */
    private pushSegment(
        from: ChartPoint,
        to: ChartPoint,
        halfWidth: number,
        rgba: readonly [number, number, number, number],
    ): void {
        const dx: number = to.x - from.x;
        const dy: number = to.y - from.y;
        const length: number = Math.hypot(dx, dy);

        if (length === 0) {
            return;
        }

        const nx: number = (-dy / length) * halfWidth;
        const ny: number = (dx / length) * halfWidth;

        this.pushQuad(
            this.pendingTriangles,
            { x: from.x + nx, y: from.y + ny },
            { x: to.x + nx, y: to.y + ny },
            { x: to.x - nx, y: to.y - ny },
            { x: from.x - nx, y: from.y - ny },
            rgba,
        );
    }

    /**
     * Appends one pie or donut wedge as triangles.
     * @param wedge - Wedge geometry.
     * @param rgba - Colour channels.
     * @returns Nothing.
     */
    private pushWedge(
        wedge: ChartWedge,
        rgba: readonly [number, number, number, number],
    ): void {
        const span: number = wedge.endAngle - wedge.startAngle;

        if (wedge.outerRadius <= 0 || Math.abs(span) <= 0) {
            return;
        }

        const segments: number = Math.max(3, Math.ceil(Math.abs(span) / WedgeSegmentAngle));

        for (let index: number = 0; index < segments; index += 1) {
            const start: number = wedge.startAngle + (span * index) / segments;
            const end: number = wedge.startAngle + (span * (index + 1)) / segments;
            const outerStart: ChartPoint = wedgePoint(
                wedge.cx,
                wedge.cy,
                wedge.outerRadius,
                start,
            );
            const outerEnd: ChartPoint = wedgePoint(wedge.cx, wedge.cy, wedge.outerRadius, end);

            if (wedge.innerRadius <= 0) {
                this.pushTriangle(
                    this.pendingTriangles,
                    { x: wedge.cx, y: wedge.cy },
                    outerStart,
                    outerEnd,
                    rgba,
                );
            } else {
                const innerStart: ChartPoint = wedgePoint(
                    wedge.cx,
                    wedge.cy,
                    wedge.innerRadius,
                    start,
                );
                const innerEnd: ChartPoint = wedgePoint(
                    wedge.cx,
                    wedge.cy,
                    wedge.innerRadius,
                    end,
                );

                this.pushQuad(
                    this.pendingTriangles,
                    outerStart,
                    outerEnd,
                    innerEnd,
                    innerStart,
                    rgba,
                );
            }
        }
    }

    /**
     * Appends one triangle.
     * @param target - Vertex array.
     * @param a - First point.
     * @param b - Second point.
     * @param c - Third point.
     * @param rgba - Colour channels.
     * @returns Nothing.
     */
    private pushTriangle(
        target: number[],
        a: ChartPoint,
        b: ChartPoint,
        c: ChartPoint,
        rgba: readonly [number, number, number, number],
    ): void {
        this.pushVertex(target, a, rgba, { x: 0, y: 0 });
        this.pushVertex(target, b, rgba, { x: 0, y: 0 });
        this.pushVertex(target, c, rgba, { x: 0, y: 0 });
    }

    /**
     * Appends one vertex.
     * @param target - Vertex array.
     * @param point - Pixel position.
     * @param rgba - Colour channels.
     * @param uv - Circle UV coordinate.
     * @returns Nothing.
     */
    private pushVertex(
        target: number[],
        point: ChartPoint,
        rgba: readonly [number, number, number, number],
        uv: ChartPoint,
    ): void {
        target.push(point.x, point.y, rgba[0], rgba[1], rgba[2], rgba[3], uv.x, uv.y);
    }
}

/**
 * Creates a chart surface backed by WebGL or the 2D canvas fallback.
 * A requested WebGL surface degrades to the canvas renderer when the browser has
 * no WebGL support or when shader compilation fails.
 * @example
 * const surface: ChartSurface | null = createChartSurface(seriesCanvas, overlayCanvas, "auto");
 * @param seriesCanvas - Bottom canvas for series shapes.
 * @param overlayCanvas - Top canvas for axes and labels.
 * @param renderer - Requested renderer.
 * @returns A surface, or null when no 2D context is available.
 */
export const createChartSurface: (
    seriesCanvas: HTMLCanvasElement,
    overlayCanvas: HTMLCanvasElement,
    renderer: ChartRenderer,
) => ChartSurface | null = (
    seriesCanvas: HTMLCanvasElement,
    overlayCanvas: HTMLCanvasElement,
    renderer: ChartRenderer,
): ChartSurface | null => {
    seriesCanvas.style.display = "block";
    const overlay2d: CanvasRenderingContext2D | null = overlayCanvas.getContext("2d");

    if (overlay2d === null) {
        return null;
    }

    if (renderer !== "canvas") {
        let gl: WebGLRenderingContext | null = null;

        try {
            gl = seriesCanvas.getContext("webgl", {
                alpha: true,
                antialias: true,
                premultipliedAlpha: true,
            });
        } catch {
            // A throwing WebGL implementation is treated as unavailable.
        }

        if (gl !== null) {
            try {
                return new ChartSurfaceImpl(seriesCanvas, overlayCanvas, null, overlay2d, gl);
            } catch {
                seriesCanvas.style.display = "none";

                return new ChartSurfaceImpl(seriesCanvas, overlayCanvas, overlay2d, overlay2d, null);
            }
        }
    }

    const series2d: CanvasRenderingContext2D | null = seriesCanvas.getContext("2d");

    if (series2d !== null) {
        return new ChartSurfaceImpl(seriesCanvas, overlayCanvas, series2d, overlay2d, null);
    }

    seriesCanvas.style.display = "none";

    return new ChartSurfaceImpl(seriesCanvas, overlayCanvas, overlay2d, overlay2d, null);
};
