import { Queue } from "../structure/list/queue";

/**
 * Relative importance of a scheduled task.
 * Type: type alias.
 * Fields: "high", "medium", "low".
 * @example
 * const priority: TaskPriority = "high";
 */
export type TaskPriority = "high" | "medium" | "low";

/**
 * Tuning options for the global scheduler.
 * Type: interface.
 * Fields: frameBudget, idleTimeout, lowFallbackDelay.
 * @example
 * Task.configure({ frameBudget: 4, idleTimeout: 500 });
 */
export interface TaskOptions {
    /**
     * Milliseconds of high- and medium-priority work allowed in one animation frame.
     * Defaults to 8; non-finite values fall back and negative values are clamped to zero.
     */
    readonly frameBudget?: number;

    /**
     * Milliseconds after which requestIdleCallback should force a low-priority callback.
     * Defaults to 1000.
     */
    readonly idleTimeout?: number;

    /**
     * Milliseconds before the setTimeout fallback runs a low-priority task when
     * requestIdleCallback is unavailable. Defaults to 0.
     */
    readonly lowFallbackDelay?: number;
}

/**
 * Immutable snapshot of scheduler timing configuration.
 * Type: interface.
 * Fields: frameBudget, idleTimeout, lowFallbackDelay.
 * @example
 * const config: TaskConfiguration = task.configuration();
 */
export interface TaskConfiguration {
    /** Milliseconds of high- and medium-priority work allowed in one animation frame. */
    readonly frameBudget: number;

    /** Milliseconds after which requestIdleCallback should force a low-priority callback. */
    readonly idleTimeout: number;

    /** Milliseconds before the setTimeout fallback runs a low-priority task. */
    readonly lowFallbackDelay: number;
}

/**
 * Options accepted by {@link Task.schedule}.
 * Type: interface.
 * Fields: priority, signal, label, timeout.
 * @example
 * const options: TaskScheduleOptions = { priority: "high", label: "hydrate" };
 */
export interface TaskScheduleOptions {
    /** Queue to place the task in; defaults to "medium". */
    readonly priority?: TaskPriority;

    /** Signal that cancels the task when aborted. */
    readonly signal?: AbortSignal;

    /** Human-readable label used in diagnostics and disposal errors. */
    readonly label?: string;

    /**
     * Milliseconds after which the task is cancelled with {@link TaskTimeoutError}.
     * Omit for no timeout; negative values are clamped to zero and non-finite values disable the timeout.
     */
    readonly timeout?: number;
}

/**
 * Lifecycle state of one scheduled task.
 * Type: type alias.
 * Fields: "queued", "running", "settled", "cancelled".
 * @example
 * const status: TaskStatus = pending.status;
 */
export type TaskStatus = "queued" | "running" | "settled" | "cancelled";

/**
 * Cancellation handle attached to every promise returned by {@link Task.schedule}.
 * Type: interface.
 * Fields: id, priority, label, status, settled, cancel.
 * @example
 * const handle: TaskHandle = task.schedule((): void => {});
 * handle.cancel();
 * // handle.status is now "cancelled" and handle.settled is true.
 */
export interface TaskHandle {
    /** Monotonically increasing identifier, unique for the lifetime of the scheduler. */
    readonly id: number;

    /** Priority queue the task was submitted to. */
    readonly priority: TaskPriority;

    /** Diagnostic label, or null when none was supplied. */
    readonly label: string | null;

    /** Current lifecycle state, read live from the scheduler. */
    readonly status: TaskStatus;

    /** Whether the task has settled, including after cancellation or disposal. */
    readonly settled: boolean;

    /**
     * Cancels the task; safe to call more than once.
     * @param reason - Optional rejection reason; defaults to a {@link TaskCancelledError}.
     * @example
     * pending.cancel(new Error("Superseded."));
     * @returns Nothing.
     */
    cancel(reason?: unknown): void;
}

/**
 * Promise returned by {@link Task.schedule}, augmented with its cancellation handle.
 * Type: type alias.
 * Fields: id, priority, label, status, settled, cancel.
 * @example
 * const pending: TaskPromise<string> = task.schedule((): string => "ready");
 * pending.cancel();
 */
export type TaskPromise<T> = Promise<T> & TaskHandle;

/**
 * Snapshot of scheduler occupancy.
 * Type: interface.
 * Fields: high, medium, low, running, total.
 * @example
 * const counts: TaskPending = task.pending();
 */
export interface TaskPending {
    /** Tasks waiting in the high-priority queue. */
    readonly high: number;

    /** Tasks waiting in the medium-priority queue. */
    readonly medium: number;

    /** Tasks waiting in the low-priority queue. */
    readonly low: number;

    /** Tasks whose run function has started but whose promise has not settled. */
    readonly running: number;

    /** Queued tasks plus running tasks. */
    readonly total: number;
}

/**
 * Lifecycle notifications published by the scheduler.
 * Type: type alias.
 * Fields: "scheduled", "started", "resolved", "rejected", "cancelled", "disposed".
 * @example
 * const type: TaskEventType = "resolved";
 */
export type TaskEventType = "scheduled" | "started" | "resolved" | "rejected" | "cancelled" | "disposed";

/**
 * Notification emitted when a task changes lifecycle state.
 * Type: interface.
 * Fields: type, id, priority, label, timestamp, reason.
 * @example
 * task.subscribe((event: TaskEvent): void => {
 *     lastEvent = event;
 * });
 */
export interface TaskEvent {
    /** Kind of lifecycle change. */
    readonly type: TaskEventType;

    /** Identifier of the task that changed. */
    readonly id: number;

    /** Priority queue the task was submitted to. */
    readonly priority: TaskPriority;

    /** Diagnostic label, or null when none was supplied. */
    readonly label: string | null;

    /** Milliseconds on the scheduler clock when the event was published. */
    readonly timestamp: number;

    /** Rejection reason for rejected, cancelled, and disposed tasks; otherwise absent. */
    readonly reason?: unknown;
}

/**
 * Observer called for every lifecycle notification.
 * Type: type alias.
 * Fields: none.
 * @example
 * const listener: TaskSubscriber = (event: TaskEvent): void => {
 *     lastType = event.type;
 * };
 */
export type TaskSubscriber = (event: TaskEvent) => void;

/**
 * Cumulative scheduler counters since the last {@link Task.resetMetrics}.
 * Type: interface.
 * Fields: scheduled, started, resolved, rejected, cancelled, disposed, peakRunning.
 * @example
 * const metrics: TaskMetrics = task.metrics();
 */
export interface TaskMetrics {
    /** Tasks accepted by schedule, including work cancelled before it ran. */
    readonly scheduled: number;

    /** Tasks whose run function was invoked. */
    readonly started: number;

    /** Tasks that resolved successfully. */
    readonly resolved: number;

    /** Tasks that threw, rejected, or returned a rejected promise. */
    readonly rejected: number;

    /** Tasks cancelled explicitly, aborted, or timed out. */
    readonly cancelled: number;

    /** Tasks rejected because the scheduler was disposed. */
    readonly disposed: number;

    /** Highest number of tasks observed running at the same time. */
    readonly peakRunning: number;
}

/**
 * Rejection reason used when a queued task is cancelled explicitly.
 * Type: class.
 * @example
 * try {
 *     await pending;
 * } catch (error: unknown) {
 *     if (error instanceof TaskCancelledError) {
 *         // The task never ran, or its result was discarded.
 *     }
 * }
 */
export class TaskCancelledError extends Error {
    /**
     * Creates a cancellation error, optionally naming the task.
     * @param label - Diagnostic label of the cancelled task.
     * @example
     * throw new TaskCancelledError("hydrate");
     * @returns A new TaskCancelledError.
     */
    public constructor(label?: string | null) {
        super(label === (void 0) || label === null ? "Task cancelled." : `Task cancelled: ${label}`);
        this.name = "TaskCancelledError";
    }
}

/**
 * Rejection reason used when {@link Task.dispose} settles outstanding work.
 * Type: class.
 * @example
 * // Pending promises reject with TaskDisposedError after disposal.
 */
export class TaskDisposedError extends Error {
    /**
     * Creates a disposal error, optionally naming the task.
     * @param label - Diagnostic label of the disposed task.
     * @example
     * throw new TaskDisposedError("hydrate");
     * @returns A new TaskDisposedError.
     */
    public constructor(label?: string | null) {
        super(label === (void 0) || label === null ? "Task scheduler disposed." : `Task scheduler disposed: ${label}`);
        this.name = "TaskDisposedError";
    }
}

/**
 * Rejection reason used when a task exceeds its configured timeout.
 * Type: class.
 * @example
 * try {
 *     await pending;
 * } catch (error: unknown) {
 *     if (error instanceof TaskTimeoutError) {
 *         // The task did not settle within its timeout.
 *     }
 * }
 */
export class TaskTimeoutError extends Error {
    /**
     * Creates a timeout error, optionally naming the task.
     * @param label - Diagnostic label of the timed-out task.
     * @example
     * throw new TaskTimeoutError("hydrate");
     * @returns A new TaskTimeoutError.
     */
    public constructor(label?: string | null) {
        super(label === (void 0) || label === null ? "Task timed out." : `Task timed out: ${label}`);
        this.name = "TaskTimeoutError";
    }
}

/**
 * Final lifecycle outcome recorded when a task settles.
 * Type: type alias.
 * Fields: "resolved", "rejected", "cancelled", "disposed".
 */
type TaskOutcome = Extract<TaskEventType, "resolved" | "rejected" | "cancelled" | "disposed">;

/**
 * Internal record for one scheduled task.
 * Type: interface.
 * Fields: id, priority, label, run, resolve, reject, signal, abort, timer, status.
 */
interface ScheduledTask {
    readonly id: number;
    readonly priority: TaskPriority;
    readonly label: string | null;
    readonly run: () => unknown | Promise<unknown>;
    readonly resolve: (value: unknown) => void;
    readonly reject: (reason: unknown) => void;
    signal: AbortSignal | null;
    abort: (() => void) | null;
    timer: number | null;
    status: TaskStatus;
}

/**
 * Promise and its captured settlement functions.
 * Type: interface.
 * Fields: promise, resolve, reject.
 */
interface Deferred<T> {
    readonly promise: Promise<T>;
    readonly resolve: (value: T) => void;
    readonly reject: (reason: unknown) => void;
}

/**
 * Default milliseconds available to one animation frame.
 * Type: constant.
 */
const DefaultFrameBudget: number = 8;

/**
 * Default timeout passed to requestIdleCallback.
 * Type: constant.
 */
const DefaultIdleTimeout: number = 1000;

/**
 * Default delay used by the setTimeout fallback for low-priority work.
 * Type: constant.
 */
const DefaultLowFallbackDelay: number = 0;

/**
 * Share of the frame budget high-priority work may consume while medium work waits.
 * Reserving the remainder stops a busy high queue from starving the medium queue.
 * Type: constant.
 */
const HighBudgetShare: number = 0.75;

/**
 * Consecutive fully-starved frames after which one medium task is promoted ahead of high.
 * Type: constant.
 */
const MediumStarvationFrameLimit: number = 2;

/**
 * Module-private token that makes external construction fail even after erasure.
 * Type: constant.
 */
const InstanceKey: unique symbol = Symbol("periodicity.task.singleton");

/**
 * Reads a monotonic clock, falling back to Date.now where performance is absent.
 * @example
 * const started: number = currentTime();
 * @returns Milliseconds on a monotonic timeline when available.
 */
const currentTime: () => number = (): number => {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
    }

    return Date.now();
};

/**
 * Checks whether a run result should be observed as a promise.
 * @param value - Value returned by a task.
 * @example
 * const asynchronous: boolean = isPromiseLike(Promise.resolve());
 * @returns True for objects or functions with a callable then method.
 */
const isPromiseLike: (value: unknown) => value is PromiseLike<unknown> = (
    value: unknown,
): value is PromiseLike<unknown> => {
    if (value === null) {
        return false;
    }

    const kind: string = typeof value;

    if (kind !== "object" && kind !== "function") {
        return false;
    }

    return typeof (value as { then?: unknown }).then === "function";
};

/**
 * Normalises a priority supplied from JavaScript or omitted by the caller.
 * @param priority - Requested priority, or undefined for the default.
 * @example
 * const priority: TaskPriority = normalisePriority((void 0));
 * @returns The requested priority, defaulting to "medium".
 * @throws TypeError When the value is not a recognised priority.
 */
const normalisePriority: (priority: TaskPriority | undefined) => TaskPriority = (
    priority: TaskPriority | undefined,
): TaskPriority => {
    if (priority === (void 0)) {
        return "medium";
    }

    if (priority === "high" || priority === "medium" || priority === "low") {
        return priority;
    }

    throw new TypeError(`Unknown task priority: ${priority}`);
};

/**
 * Normalises a duration option, rejecting non-finite values and clamping negatives.
 * @param value - Requested duration in milliseconds.
 * @param fallback - Value used when the request is not finite.
 * @example
 * const budget: number = normaliseDuration(-1, 8);
 * @returns A duration greater than or equal to zero.
 */
const normaliseDuration: (value: number, fallback: number) => number = (
    value: number,
    fallback: number,
): number => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(0, value);
};

/**
 * Creates a promise together with its settlement functions.
 * @example
 * const deferred: Deferred<number> = createDeferred<number>();
 * @returns The pending promise and its resolve/reject pair.
 */
const createDeferred: <T>() => Deferred<T> = <T>(): Deferred<T> => {
    let resolveTask!: (value: T) => void;
    let rejectTask!: (reason: unknown) => void;
    const promise: Promise<T> = new Promise<T>(
        (resolve: (value: T) => void, reject: (reason: unknown) => void): void => {
            resolveTask = resolve;
            rejectTask = reject;
        },
    );

    return { promise, resolve: resolveTask, reject: rejectTask };
};

/**
 * Requests an animation frame in browsers, on globalThis-like hosts, or through setTimeout.
 * @param callback - Frame callback to invoke.
 * @example
 * const cancel: () => void = requestFrame((): void => {});
 * @returns A function that cancels the pending request.
 */
const requestFrame: (callback: () => void) => () => void = (callback: () => void): (() => void) => {
    if (
        typeof window !== "undefined" &&
        typeof window.requestAnimationFrame === "function" &&
        typeof window.cancelAnimationFrame === "function"
    ) {
        const host: Window = window;
        const handle: number = host.requestAnimationFrame(callback);

        return (): void => {
            host.cancelAnimationFrame(handle);
        };
    }

    if (
        typeof globalThis.requestAnimationFrame === "function" &&
        typeof globalThis.cancelAnimationFrame === "function"
    ) {
        const handle: number = globalThis.requestAnimationFrame(callback);

        return (): void => {
            globalThis.cancelAnimationFrame(handle);
        };
    }

    const handle: number = setTimeout(callback, 0);

    return (): void => {
        clearTimeout(handle);
    };
};

/**
 * Requests browser idle time, falling back to setTimeout outside the browser.
 * @param callback - Idle callback; receives null when invoked by the fallback.
 * @param timeout - requestIdleCallback timeout in milliseconds.
 * @param fallbackDelay - Delay used by the setTimeout fallback.
 * @example
 * const cancel: () => void = requestIdle((): void => {}, 1000, 0);
 * @returns A function that cancels the pending request.
 */
const requestIdle: (
    callback: (deadline: IdleDeadline | null) => void,
    timeout: number,
    fallbackDelay: number,
) => () => void = (
    callback: (deadline: IdleDeadline | null) => void,
    timeout: number,
    fallbackDelay: number,
): (() => void) => {
    if (
        typeof window !== "undefined" &&
        typeof window.requestIdleCallback === "function" &&
        typeof window.cancelIdleCallback === "function"
    ) {
        const host: Window = window;
        const handle: number = host.requestIdleCallback(
            (deadline: IdleDeadline): void => {
                callback(deadline);
            },
            { timeout },
        );

        return (): void => {
            host.cancelIdleCallback(handle);
        };
    }

    if (
        typeof globalThis.requestIdleCallback === "function" &&
        typeof globalThis.cancelIdleCallback === "function"
    ) {
        const handle: number = globalThis.requestIdleCallback(
            (deadline: IdleDeadline): void => {
                callback(deadline);
            },
            { timeout },
        );

        return (): void => {
            globalThis.cancelIdleCallback(handle);
        };
    }

    const handle: number = setTimeout((): void => {
        callback(null);
    }, fallbackDelay);

    return (): void => {
        clearTimeout(handle);
    };
};

/**
 * Global priority task scheduler.
 * Type: class.
 *
 * High- and medium-priority tasks are drained inside requestAnimationFrame callbacks under a
 * per-frame time budget. High normally runs before medium. While medium work is waiting, high may
 * consume at most 75% of the frame so medium receives a slice; any work left over stays queued.
 * If high still consumes the whole budget for two consecutive frames, the next frame runs one
 * medium task first, then high, so neither queue can be starved permanently. Individual tasks
 * cannot be pre-empted, so a single task that runs longer than the budget can overrun it; the
 * scheduler still stops before starting another task.
 *
 * Low-priority tasks never enter the animation-frame path. They are drained from
 * requestIdleCallback while the browser is idle, or from a setTimeout fallback when idle callbacks
 * are unavailable. Low work is also capped per idle callback by the browser-provided deadline.
 *
 * Only one instance can exist. The constructor is private and also rejects a missing module token
 * at runtime; use {@link Task.instance}, {@link Task.shared}, or the exported `task` singleton.
 *
 * Lifecycle notifications are available through {@link Task.subscribe}, cumulative counters through
 * {@link Task.metrics}, and current occupancy through {@link Task.pending}.
 *
 * @example
 * const value: string = await Task.instance.schedule((): string => "ready", { priority: "high" });
 * Task.configure({ frameBudget: 4 });
 * const counts: TaskPending = Task.instance.pending();
 */
export class Task {
    private static current: Task | null = null;

    private readonly high: Queue<ScheduledTask>;
    private readonly medium: Queue<ScheduledTask>;
    private readonly low: Queue<ScheduledTask>;
    private readonly active: Map<number, ScheduledTask>;
    private readonly listeners: Set<TaskSubscriber>;
    private frameRequest: (() => void) | null;
    private idleRequest: (() => void) | null;
    private frameRunning: boolean;
    private idleRunning: boolean;
    private disposed: boolean;
    private running: number;
    private mediumStarvedFrames: number;
    private lastId: number;
    private frameBudget: number;
    private idleTimeout: number;
    private lowFallbackDelay: number;
    private scheduledCount: number;
    private startedCount: number;
    private resolvedCount: number;
    private rejectedCount: number;
    private cancelledCount: number;
    private disposedCount: number;
    private peakRunning: number;

    /**
     * Creates the scheduler after verifying the module-private singleton token.
     * @param token - Singleton token; external callers cannot obtain it.
     * @example
     * // Call Task.instance instead.
     * @returns A new Task.
     * @throws TypeError When the token does not match the module token.
     */
    private constructor(token: symbol) {
        if (token !== InstanceKey) {
            throw new TypeError("Task is a singleton; use Task.instance or Task.shared.");
        }

        this.high = new Queue<ScheduledTask>();
        this.medium = new Queue<ScheduledTask>();
        this.low = new Queue<ScheduledTask>();
        this.active = new Map<number, ScheduledTask>();
        this.listeners = new Set<TaskSubscriber>();
        this.frameRequest = null;
        this.idleRequest = null;
        this.frameRunning = false;
        this.idleRunning = false;
        this.disposed = false;
        this.running = 0;
        this.mediumStarvedFrames = 0;
        this.lastId = 0;
        this.frameBudget = DefaultFrameBudget;
        this.idleTimeout = DefaultIdleTimeout;
        this.lowFallbackDelay = DefaultLowFallbackDelay;
        this.scheduledCount = 0;
        this.startedCount = 0;
        this.resolvedCount = 0;
        this.rejectedCount = 0;
        this.cancelledCount = 0;
        this.disposedCount = 0;
        this.peakRunning = 0;
    }

    /**
     * The single scheduler instance, created on first access and reused thereafter.
     * A disposed instance re-arms itself when work is scheduled again.
     * @example
     * const scheduler: Task = Task.instance;
     * @returns The global Task.
     */
    public static get instance(): Task {
        if (Task.current === null) {
            Task.current = new Task(InstanceKey);
        }

        return Task.current;
    }

    /**
     * Alias for {@link Task.instance}.
     * @example
     * const scheduler: Task = Task.shared;
     * @returns The global Task.
     */
    public static get shared(): Task {
        return Task.instance;
    }

    /**
     * Updates timing options on the global scheduler.
     * @param options - Partial options to merge into the current configuration.
     * @example
     * Task.configure({ frameBudget: 4 });
     * @returns Nothing.
     */
    public static configure(options: TaskOptions): void {
        Task.instance.configure(options);
    }

    /**
     * Reads the current timing configuration of the global scheduler.
     * @example
     * const config: TaskConfiguration = Task.configuration();
     * @returns A snapshot of the global configuration.
     */
    public static configuration(): TaskConfiguration {
        return Task.instance.configuration();
    }

    /**
     * Restores the global scheduler to its default timing configuration.
     * @example
     * Task.resetConfiguration();
     * @returns Nothing.
     */
    public static resetConfiguration(): void {
        Task.instance.resetConfiguration();
    }

    /**
     * Cancels every outstanding task on the global scheduler.
     * @param priority - Optional queue to cancel; omit to cancel every queue.
     * @example
     * const cancelled: number = Task.cancelAll();
     * @returns Number of tasks cancelled.
     */
    public static cancelAll(priority?: TaskPriority): number {
        return Task.instance.cancelAll(priority);
    }

    /**
     * Subscribes to lifecycle events from the global scheduler.
     * @param listener - Observer called for every event.
     * @example
     * const unsubscribe: () => void = Task.subscribe(handleTaskEvent);
     * @returns A function that removes the subscription.
     */
    public static subscribe(listener: TaskSubscriber): () => void {
        return Task.instance.subscribe(listener);
    }

    /**
     * Reads cumulative global scheduler counters.
     * @example
     * const metrics: TaskMetrics = Task.metrics();
     * @returns A snapshot of the global metrics.
     */
    public static metrics(): TaskMetrics {
        return Task.instance.metrics();
    }

    /**
     * Resets cumulative global scheduler counters.
     * @example
     * Task.resetMetrics();
     * @returns Nothing.
     */
    public static resetMetrics(): void {
        Task.instance.resetMetrics();
    }

    /**
     * Checks whether the global scheduler has no queued or running work.
     * @example
     * const idle: boolean = Task.isIdle();
     * @returns True when no tasks are outstanding.
     */
    public static isIdle(): boolean {
        return Task.instance.isIdle();
    }

    /**
     * Updates timing options on this scheduler.
     * Changes apply to subsequent frame and idle requests; a callback already in flight keeps
     * the budget it started with.
     * @param options - Partial options to merge into the current configuration.
     * @example
     * task.configure({ frameBudget: 4, idleTimeout: 500 });
     * @returns Nothing.
     */
    public configure(options: TaskOptions): void {
        if (options.frameBudget !== (void 0)) {
            this.frameBudget = normaliseDuration(options.frameBudget, DefaultFrameBudget);
        }

        if (options.idleTimeout !== (void 0)) {
            this.idleTimeout = normaliseDuration(options.idleTimeout, DefaultIdleTimeout);
        }

        if (options.lowFallbackDelay !== (void 0)) {
            this.lowFallbackDelay = normaliseDuration(options.lowFallbackDelay, DefaultLowFallbackDelay);
        }
    }

    /**
     * Reads this scheduler's timing configuration.
     * @example
     * const config: TaskConfiguration = task.configuration();
     * @returns A snapshot of the current configuration.
     */
    public configuration(): TaskConfiguration {
        return {
            frameBudget: this.frameBudget,
            idleTimeout: this.idleTimeout,
            lowFallbackDelay: this.lowFallbackDelay,
        };
    }

    /**
     * Restores this scheduler to its default timing configuration.
     * @example
     * task.resetConfiguration();
     * @returns Nothing.
     */
    public resetConfiguration(): void {
        this.frameBudget = DefaultFrameBudget;
        this.idleTimeout = DefaultIdleTimeout;
        this.lowFallbackDelay = DefaultLowFallbackDelay;
    }

    /**
     * Queues a task and returns a promise with an attached cancellation handle.
     * The promise resolves with the task result, or with the result of the promise the task
     * returns. A synchronous throw or a rejected returned promise rejects it. Cancelling a queued
     * task prevents it from running; cancelling a running task discards its eventual result.
     * @param run - Work to run; may return a value or a promise.
     * @param options - Priority, abort signal, diagnostic label, and timeout.
     * @example
     * const pending: TaskPromise<number> = task.schedule((): number => 42, { priority: "high" });
     * const value: number = await pending;
     * @returns A promise augmented with an id, priority, label, live status, and cancel method.
     * @throws TypeError When the priority is not "high", "medium", or "low".
     */
    public schedule<T>(run: () => T | Promise<T>, options?: TaskScheduleOptions): TaskPromise<T> {
        this.disposed = false;

        const priority: TaskPriority = normalisePriority(options?.priority);
        const label: string | null = options?.label === (void 0) ? null : options.label;
        const signal: AbortSignal | null = options?.signal === (void 0) ? null : options.signal;
        const requestedTimeout: number | void = options?.timeout;
        const timeout: number | void =
            requestedTimeout === (void 0) || !Number.isFinite(requestedTimeout)
                ? (void 0)
                : Math.max(0, requestedTimeout);
        const id: number = this.nextId();
        const deferred: Deferred<T> = createDeferred<T>();
        const entry: ScheduledTask = {
            id,
            priority,
            label,
            run,
            resolve: (value: unknown): void => {
                deferred.resolve(value as T);
            },
            reject: (reason: unknown): void => {
                deferred.reject(reason);
            },
            signal,
            abort: null,
            timer: null,
            status: "queued",
        };
        const cancelHandle: (reason?: unknown) => void = (reason?: unknown): void => {
            this.cancel(id, reason);
        };
        const promise: TaskPromise<T> = Object.defineProperties(deferred.promise, {
            id: { value: id, enumerable: true },
            priority: { value: priority, enumerable: true },
            label: { value: label, enumerable: true },
            status: { get: (): TaskStatus => entry.status, enumerable: true },
            settled: {
                get: (): boolean => entry.status === "settled" || entry.status === "cancelled",
                enumerable: true,
            },
            cancel: { value: cancelHandle, enumerable: true },
        }) as TaskPromise<T>;

        const signalReason: () => unknown = (): unknown => {
            return signal === null || signal.reason === (void 0)
                ? new TaskCancelledError(label)
                : signal.reason;
        };

        this.active.set(id, entry);

        if (signal !== null && !signal.aborted) {
            const abort: () => void = (): void => {
                this.abortTask(id, signalReason());
            };

            entry.abort = abort;
            signal.addEventListener("abort", abort, { once: true });
        }

        this.enqueue(entry);
        this.record("scheduled", entry);

        if (entry.status !== "queued") {
            return promise;
        }

        if (signal !== null && signal.aborted) {
            const abortReason: unknown = signalReason();

            this.remove(entry);
            this.releaseRequestsIfIdle();
            this.settle(
                entry,
                (): void => {
                    deferred.reject(abortReason);
                },
                "cancelled",
                abortReason,
            );

            return promise;
        }

        if (timeout !== (void 0)) {
            entry.timer = setTimeout((): void => {
                this.abortTask(id, new TaskTimeoutError(label));
            }, timeout);
        }

        return promise;
    }

    /**
     * Cancels a queued or running task by handle or numeric id.
     * Queued work is removed from its FIFO queue and never invoked. Running work cannot be
     * interrupted, but its result is discarded and the returned promise rejects. A cancelled
     * task rejects with {@link TaskCancelledError}; aborting through an AbortSignal uses the
     * signal reason instead.
     * @param target - Handle returned by schedule, or its numeric id.
     * @param reason - Optional rejection reason; defaults to a {@link TaskCancelledError}.
     * @example
     * const pending: TaskPromise<void> = task.schedule((): void => {});
     * task.cancel(pending);
     * @returns True when an outstanding task was cancelled, false when it had already settled.
     */
    public cancel(target: TaskHandle | number, reason?: unknown): boolean {
        const id: number = typeof target === "number" ? target : target.id;
        const entry: ScheduledTask | undefined = this.active.get(id);

        if (entry === (void 0)) {
            return false;
        }

        const cancellation: unknown = reason === (void 0) ? new TaskCancelledError(entry.label) : reason;

        this.remove(entry);
        this.releaseRequestsIfIdle();
        this.settle(
            entry,
            (): void => {
                entry.reject(cancellation);
            },
            "cancelled",
            cancellation,
        );

        return true;
    }

    /**
     * Cancels every outstanding task, optionally limited to one priority queue.
     * Each cancelled promise rejects with {@link TaskCancelledError}.
     * @param priority - Queue to cancel, or undefined to cancel every queue.
     * @example
     * const cancelled: number = task.cancelAll("low");
     * @returns Number of tasks that were cancelled.
     */
    public cancelAll(priority?: TaskPriority): number {
        const entries: ScheduledTask[] = Array.from(this.active.values()).filter(
            (entry: ScheduledTask): boolean => priority === (void 0) || entry.priority === priority,
        );
        let cancelled: number = 0;

        entries.forEach((entry: ScheduledTask): void => {
            if (this.cancel(entry.id)) {
                cancelled += 1;
            }
        });

        return cancelled;
    }

    /**
     * Number of tasks waiting in a queue, or in all queues when no priority is given.
     * Running tasks are not counted; use {@link Task.pending} to include them.
     * @param priority - Queue to measure, or undefined for all queued work.
     * @example
     * const high: number = task.size("high");
     * const queued: number = task.size();
     * @returns Number of queued tasks.
     */
    public size(priority?: TaskPriority): number {
        if (priority === (void 0)) {
            return Number(this.high.size() + this.medium.size() + this.low.size());
        }

        return Number(this.queueFor(priority).size());
    }

    /**
     * Snapshot of queued and running task counts per priority.
     * @example
     * const state: TaskPending = task.pending();
     * @returns Counts for high, medium, low, running, and total work.
     */
    public pending(): TaskPending {
        const high: number = Number(this.high.size());
        const medium: number = Number(this.medium.size());
        const low: number = Number(this.low.size());

        return { high, medium, low, running: this.running, total: high + medium + low + this.running };
    }

    /**
     * Checks whether this scheduler has no queued or running work.
     * A pending frame or idle request is not treated as work.
     * @example
     * const idle: boolean = task.isIdle();
     * @returns True when no tasks are outstanding.
     */
    public isIdle(): boolean {
        return this.active.size === 0;
    }

    /**
     * Subscribes to lifecycle events from this scheduler.
     * Listener failures are ignored so observation cannot break scheduling. Subscriptions survive
     * {@link Task.dispose}; remove them with the returned function when they are no longer needed.
     * @param listener - Observer called for every lifecycle event.
     * @example
     * const unsubscribe: () => void = task.subscribe((event: TaskEvent): void => {
     *     lastEvent = event;
     * });
     * unsubscribe();
     * @returns A function that removes the subscription.
     */
    public subscribe(listener: TaskSubscriber): () => void {
        this.listeners.add(listener);

        return (): void => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Reads cumulative counters for this scheduler.
     * @example
     * const metrics: TaskMetrics = task.metrics();
     * @returns A snapshot of the counters since the last reset.
     */
    public metrics(): TaskMetrics {
        return {
            scheduled: this.scheduledCount,
            started: this.startedCount,
            resolved: this.resolvedCount,
            rejected: this.rejectedCount,
            cancelled: this.cancelledCount,
            disposed: this.disposedCount,
            peakRunning: this.peakRunning,
        };
    }

    /**
     * Resets the cumulative counters and seeds the peak running count with the current running total.
     * @example
     * task.resetMetrics();
     * @returns Nothing.
     */
    public resetMetrics(): void {
        this.scheduledCount = 0;
        this.startedCount = 0;
        this.resolvedCount = 0;
        this.rejectedCount = 0;
        this.cancelledCount = 0;
        this.disposedCount = 0;
        this.peakRunning = this.running;
    }

    /**
     * Cancels every outstanding task, clears the queues, and releases the frame and idle requests.
     * Pending promises reject with {@link TaskDisposedError}. The singleton is not destroyed:
     * scheduling again re-arms the same instance, and Task.instance keeps returning it.
     * @example
     * task.dispose();
     * @returns Nothing.
     */
    public dispose(): void {
        this.disposed = true;

        if (this.frameRequest !== null) {
            this.frameRequest();
            this.frameRequest = null;
        }

        if (this.idleRequest !== null) {
            this.idleRequest();
            this.idleRequest = null;
        }

        const entries: ScheduledTask[] = Array.from(this.active.values());

        entries.forEach((entry: ScheduledTask): void => {
            const disposedError: TaskDisposedError = new TaskDisposedError(entry.label);

            this.settle(
                entry,
                (): void => {
                    entry.reject(disposedError);
                },
                "disposed",
                disposedError,
            );
        });

        this.high.clear();
        this.medium.clear();
        this.low.clear();
        this.active.clear();
        this.running = 0;
        this.mediumStarvedFrames = 0;
    }

    /**
     * Returns the next identifier in the per-instance monotonic sequence.
     * @example
     * const id: number = this.nextId();
     * @returns A fresh task id.
     */
    private nextId(): number {
        this.lastId += 1;

        return this.lastId;
    }

    /**
     * Adds a task to its priority queue and arms the matching drain loop.
     * @param entry - Task to enqueue.
     * @example
     * this.enqueue(entry);
     * @returns Nothing.
     */
    private enqueue(entry: ScheduledTask): void {
        this.queueFor(entry.priority).enqueue(entry);

        if (entry.priority === "low") {
            this.ensureIdle();
        } else {
            this.ensureFrame();
        }
    }

    /**
     * Selects the FIFO queue for a priority.
     * @param priority - Priority whose queue is needed.
     * @example
     * const queue: Queue<ScheduledTask> = this.queueFor("high");
     * @returns The high, medium, or low queue.
     */
    private queueFor(priority: TaskPriority): Queue<ScheduledTask> {
        if (priority === "high") {
            return this.high;
        }

        if (priority === "medium") {
            return this.medium;
        }

        return this.low;
    }

    /**
     * Removes a still-queued task from its FIFO queue.
     * @param entry - Task being cancelled.
     * @example
     * this.remove(entry);
     * @returns Nothing.
     */
    private remove(entry: ScheduledTask): void {
        if (entry.status !== "queued") {
            return;
        }

        this.queueFor(entry.priority).removeIf((candidate: ScheduledTask): boolean => candidate.id === entry.id);
    }

    /**
     * Marks a task settled, releases its abort listener and timeout, and publishes the outcome.
     * @param entry - Task to settle.
     * @param completion - Resolve or reject action for the task promise.
     * @param outcome - Final lifecycle outcome used for status, counters, and observers.
     * @param reason - Optional rejection reason reported to observers.
     * @example
     * this.settle(entry, (): void => entry.resolve(value), "resolved");
     * @returns Nothing.
     */
    private settle(
        entry: ScheduledTask,
        completion: () => void,
        outcome: TaskOutcome,
        reason?: unknown,
    ): void {
        if (entry.status === "settled" || entry.status === "cancelled") {
            return;
        }

        if (entry.status === "running") {
            this.running -= 1;
        }

        entry.status = outcome === "resolved" || outcome === "rejected" ? "settled" : "cancelled";
        this.active.delete(entry.id);

        if (entry.signal !== null && entry.abort !== null) {
            entry.signal.removeEventListener("abort", entry.abort);
        }

        if (entry.timer !== null) {
            clearTimeout(entry.timer);
            entry.timer = null;
        }

        entry.signal = null;
        entry.abort = null;
        completion();
        this.record(outcome, entry, reason);
    }

    /**
     * Rejects a task because its AbortSignal fired or its timeout elapsed.
     * @param id - Identifier of the aborted task.
     * @param reason - Signal or timeout reason used as the rejection value.
     * @example
     * this.abortTask(id, signal.reason);
     * @returns Nothing.
     */
    private abortTask(id: number, reason: unknown): void {
        const entry: ScheduledTask | undefined = this.active.get(id);

        if (entry === (void 0)) {
            return;
        }

        this.remove(entry);
        this.releaseRequestsIfIdle();
        this.settle(
            entry,
            (): void => {
                entry.reject(reason);
            },
            "cancelled",
            reason,
        );
    }

    /**
     * Counts a lifecycle event and publishes it to every subscriber.
     * Observer failures are swallowed so diagnostics cannot disturb scheduling.
     * @param type - Lifecycle event type.
     * @param entry - Task that changed state.
     * @param reason - Optional rejection reason for terminal events.
     * @example
     * this.record("started", entry);
     * @returns Nothing.
     */
    private record(type: TaskEventType, entry: ScheduledTask, reason?: unknown): void {
        if (type === "scheduled") {
            this.scheduledCount += 1;
        } else if (type === "started") {
            this.startedCount += 1;
        } else if (type === "resolved") {
            this.resolvedCount += 1;
        } else if (type === "rejected") {
            this.rejectedCount += 1;
        } else if (type === "cancelled") {
            this.cancelledCount += 1;
        } else {
            this.disposedCount += 1;
        }

        this.emit(type, entry, reason);
    }

    /**
     * Publishes one lifecycle event to every subscriber.
     * @param type - Lifecycle event type.
     * @param entry - Task that changed state.
     * @param reason - Optional rejection reason for terminal events.
     * @example
     * this.emit("resolved", entry);
     * @returns Nothing.
     */
    private emit(type: TaskEventType, entry: ScheduledTask, reason?: unknown): void {
        if (this.listeners.size === 0) {
            return;
        }

        const event: TaskEvent = {
            type,
            id: entry.id,
            priority: entry.priority,
            label: entry.label,
            timestamp: currentTime(),
            reason,
        };

        this.listeners.forEach((listener: TaskSubscriber): void => {
            try {
                listener(event);
            } catch {
                // Diagnostics must not disturb scheduling.
            }
        });
    }

    /**
     * Cancels an armed frame or idle request when its queue has become empty.
     * This avoids a pointless callback when the last queued task is cancelled before its
     * scheduled drain runs. A callback that is already executing is left to finish normally.
     * @example
     * this.releaseRequestsIfIdle();
     * @returns Nothing.
     */
    private releaseRequestsIfIdle(): void {
        if (!this.frameRunning && this.frameRequest !== null && this.high.isEmpty() && this.medium.isEmpty()) {
            this.frameRequest();
            this.frameRequest = null;
        }

        if (!this.idleRunning && this.idleRequest !== null && this.low.isEmpty()) {
            this.idleRequest();
            this.idleRequest = null;
        }
    }

    /**
     * Invokes a task, observing synchronous and asynchronous errors without breaking the loop.
     * The frame budget covers the synchronous portion of run; asynchronous continuations settle
     * the task promise later and do not block the queue.
     * @param entry - Task to invoke.
     * @example
     * this.execute(entry);
     * @returns Nothing.
     */
    private execute(entry: ScheduledTask): void {
        if (entry.status !== "queued") {
            return;
        }

        entry.status = "running";
        this.running += 1;

        if (this.running > this.peakRunning) {
            this.peakRunning = this.running;
        }

        this.record("started", entry);

        if (entry.status !== "running") {
            return;
        }

        try {
            const result: unknown = entry.run();

            if (!isPromiseLike(result)) {
                this.settle(
                    entry,
                    (): void => {
                        entry.resolve(result);
                    },
                    "resolved",
                );

                return;
            }

            Promise.resolve(result).then(
                (value: unknown): void => {
                    this.settle(
                        entry,
                        (): void => {
                            entry.resolve(value);
                        },
                        "resolved",
                    );
                },
                (reason: unknown): void => {
                    this.settle(
                        entry,
                        (): void => {
                            entry.reject(reason);
                        },
                        "rejected",
                        reason,
                    );
                },
            );
        } catch (error: unknown) {
            this.settle(
                entry,
                (): void => {
                    entry.reject(error);
                },
                "rejected",
                error,
            );
        }
    }

    /**
     * Drains high then medium work under one frame budget.
     * High may use at most 75% of the budget while medium is waiting. If medium has been
     * completely starved for two consecutive frames, one medium task is promoted to the start
     * of this frame and the starvation counter resets; this is the only medium-before-high case
     * and it guarantees that both queues make progress. Each loop checks the deadline before
     * starting a task; unfinished work remains in its FIFO queue for the next frame.
     * @example
     * this.drainFrame();
     * @returns Nothing.
     */
    private drainFrame(): void {
        const started: number = currentTime();
        const deadline: number = started + this.frameBudget;
        const mediumWaiting: boolean = !this.medium.isEmpty();
        const promoteMedium: boolean =
            mediumWaiting && !this.high.isEmpty() && this.mediumStarvedFrames >= MediumStarvationFrameLimit;
        let processed: number = 0;
        let mediumServed: boolean = false;

        if (promoteMedium) {
            const entry: ScheduledTask = this.medium.dequeue();
            processed = 1;
            mediumServed = true;
            this.execute(entry);

            if (this.disposed) {
                return;
            }
        }

        const highDeadline: number = this.medium.isEmpty() ? deadline : started + this.frameBudget * HighBudgetShare;

        while (!this.high.isEmpty()) {
            if (processed > 0 && currentTime() >= highDeadline) {
                break;
            }

            const entry: ScheduledTask = this.high.dequeue();
            processed += 1;
            this.execute(entry);

            if (this.disposed) {
                return;
            }
        }

        while (!this.medium.isEmpty()) {
            if (processed > 0 && currentTime() >= deadline) {
                break;
            }

            const entry: ScheduledTask = this.medium.dequeue();
            processed += 1;
            mediumServed = true;
            this.execute(entry);

            if (this.disposed) {
                return;
            }
        }

        if (mediumWaiting && !mediumServed && !this.medium.isEmpty()) {
            this.mediumStarvedFrames += 1;
        } else {
            this.mediumStarvedFrames = 0;
        }
    }

    /**
     * Arms one animation-frame request when high or medium work is waiting.
     * Never requests a frame for an empty queue, an already-armed request, or a running callback.
     * @example
     * this.ensureFrame();
     * @returns Nothing.
     */
    private ensureFrame(): void {
        if (this.disposed || this.frameRunning || this.frameRequest !== null) {
            return;
        }

        if (this.high.isEmpty() && this.medium.isEmpty()) {
            return;
        }

        this.frameRequest = requestFrame(this.handleFrame);
    }

    /**
     * Arms one idle request when low-priority work is waiting.
     * Never requests idle time for an empty queue, an already-armed request, or a running callback.
     * @example
     * this.ensureIdle();
     * @returns Nothing.
     */
    private ensureIdle(): void {
        if (this.disposed || this.idleRunning || this.idleRequest !== null || this.low.isEmpty()) {
            return;
        }

        this.idleRequest = requestIdle(this.handleIdle, this.idleTimeout, this.lowFallbackDelay);
    }

    /**
     * Animation-frame callback: drains one budgeted slice of high and medium work.
     * Re-arms only while work remains and the scheduler has not been disposed.
     * @example
     * this.frameRequest = requestFrame(this.handleFrame);
     * @returns Nothing.
     */
    private readonly handleFrame: () => void = (): void => {
        this.frameRequest = null;

        if (this.disposed) {
            return;
        }

        this.frameRunning = true;

        try {
            this.drainFrame();
        } finally {
            this.frameRunning = false;
            this.ensureFrame();
        }
    };

    /**
     * Idle callback: drains low-priority work without touching the animation-frame budget.
     * A real idle deadline is obeyed after the first task; the setTimeout fallback runs one task
     * per tick so it cannot monopolise the event loop.
     * @param deadline - Browser idle deadline, or null for the fallback.
     * @example
     * this.idleRequest = requestIdle(this.handleIdle, 1000, 0);
     * @returns Nothing.
     */
    private readonly handleIdle: (deadline: IdleDeadline | null) => void = (
        deadline: IdleDeadline | null,
    ): void => {
        this.idleRequest = null;

        if (this.disposed) {
            return;
        }

        this.idleRunning = true;

        try {
            if (deadline === null) {
                if (!this.low.isEmpty()) {
                    this.execute(this.low.dequeue());
                }
            } else {
                let processed: number = 0;

                while (!this.low.isEmpty()) {
                    if (processed > 0 && deadline.timeRemaining() <= 0) {
                        break;
                    }

                    const entry: ScheduledTask = this.low.dequeue();
                    processed += 1;
                    this.execute(entry);

                    if (this.disposed) {
                        return;
                    }
                }
            }
        } finally {
            this.idleRunning = false;
            this.ensureIdle();
        }
    };
}

/**
 * Convenience singleton for the global scheduler.
 * It is the same object returned by {@link Task.instance} and {@link Task.shared}.
 * @example
 * const pending: TaskPromise<void> = task.schedule((): void => {});
 * @returns The global Task instance.
 */
export const task: Task = Task.instance;

export default task;
