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
 * Options accepted by {@link Task.schedule}.
 * Type: interface.
 * Fields: priority, signal, label.
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
}

/**
 * Cancellation handle attached to every promise returned by {@link Task.schedule}.
 * Type: interface.
 * Fields: id, priority, label, cancel.
 * @example
 * const handle: TaskHandle = task.schedule((): void => {});
 * handle.cancel();
 */
export interface TaskHandle {
    /** Monotonically increasing identifier, unique for the lifetime of the scheduler. */
    readonly id: number;

    /** Priority queue the task was submitted to. */
    readonly priority: TaskPriority;

    /** Diagnostic label, or null when none was supplied. */
    readonly label: string | null;

    /** Cancels the task; safe to call more than once. */
    cancel(): void;
}

/**
 * Promise returned by {@link Task.schedule}, augmented with its cancellation handle.
 * Type: type alias.
 * Fields: id, priority, label, cancel.
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
 * Internal lifecycle state of a scheduled task.
 * Type: type alias.
 * Fields: "queued", "running", "settled".
 */
type TaskState = "queued" | "running" | "settled";

/**
 * Internal record for one scheduled task.
 * Type: interface.
 * Fields: id, priority, label, run, resolve, reject, signal, abort, state.
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
    state: TaskState;
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
     * Queues a task and returns a promise with an attached cancellation handle.
     * The promise resolves with the task result, or with the result of the promise the task
     * returns. A synchronous throw or a rejected returned promise rejects it. Cancelling a queued
     * task prevents it from running; cancelling a running task discards its eventual result.
     * @param run - Work to run; may return a value or a promise.
     * @param options - Priority, abort signal, and diagnostic label.
     * @example
     * const pending: TaskPromise<number> = task.schedule((): number => 42, { priority: "high" });
     * const value: number = await pending;
     * @returns A promise augmented with an id, priority, label, and cancel method.
     * @throws TypeError When the priority is not "high", "medium", or "low".
     */
    public schedule<T>(run: () => T | Promise<T>, options?: TaskScheduleOptions): TaskPromise<T> {
        this.disposed = false;

        const priority: TaskPriority = normalisePriority(options?.priority);
        const label: string | null = options?.label === (void 0) ? null : options.label;
        const signal: AbortSignal | null = options?.signal === (void 0) ? null : options.signal;
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
            state: "queued",
        };
        const cancelHandle: () => void = (): void => {
            this.cancel(id);
        };
        const promise: TaskPromise<T> = Object.assign(deferred.promise, {
            id,
            priority,
            label,
            cancel: cancelHandle,
        });

        if (signal !== null) {
            const reason: () => unknown = (): unknown => {
                return signal.reason === (void 0) ? new TaskCancelledError(label) : signal.reason;
            };

            if (signal.aborted) {
                deferred.reject(reason());

                return promise;
            }

            const abort: () => void = (): void => {
                this.abortTask(id, reason());
            };

            entry.abort = abort;
            signal.addEventListener("abort", abort, { once: true });
        }

        this.active.set(id, entry);
        this.enqueue(entry);

        return promise;
    }

    /**
     * Cancels a queued or running task by handle or numeric id.
     * Queued work is removed from its FIFO queue and never invoked. Running work cannot be
     * interrupted, but its result is discarded and the returned promise rejects. A cancelled
     * task rejects with {@link TaskCancelledError}; aborting through an AbortSignal uses the
     * signal reason instead.
     * @param target - Handle returned by schedule, or its numeric id.
     * @example
     * const pending: TaskPromise<void> = task.schedule((): void => {});
     * task.cancel(pending);
     * @returns True when an outstanding task was cancelled, false when it had already settled.
     */
    public cancel(target: TaskHandle | number): boolean {
        const id: number = typeof target === "number" ? target : target.id;
        const entry: ScheduledTask | undefined = this.active.get(id);

        if (entry === (void 0)) {
            return false;
        }

        this.remove(entry);
        this.releaseRequestsIfIdle();
        this.settle(entry, (): void => {
            entry.reject(new TaskCancelledError(entry.label));
        });

        return true;
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
            this.settle(entry, (): void => {
                entry.reject(new TaskDisposedError(entry.label));
            });
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
        if (entry.state !== "queued") {
            return;
        }

        this.queueFor(entry.priority).removeIf((candidate: ScheduledTask): boolean => candidate.id === entry.id);
    }

    /**
     * Marks a task settled and releases its abort listener.
     * @param entry - Task to settle.
     * @param completion - Resolve or reject action for the task promise.
     * @example
     * this.settle(entry, (): void => entry.resolve(value));
     * @returns Nothing.
     */
    private settle(entry: ScheduledTask, completion: () => void): void {
        if (entry.state === "settled") {
            return;
        }

        if (entry.state === "running") {
            this.running -= 1;
        }

        entry.state = "settled";
        this.active.delete(entry.id);

        if (entry.signal !== null && entry.abort !== null) {
            entry.signal.removeEventListener("abort", entry.abort);
        }

        entry.signal = null;
        entry.abort = null;
        completion();
    }

    /**
     * Rejects a task because its AbortSignal fired.
     * @param id - Identifier of the aborted task.
     * @param reason - Signal reason used as the rejection value.
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
        this.settle(entry, (): void => {
            entry.reject(reason);
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
        if (entry.state !== "queued") {
            return;
        }

        entry.state = "running";
        this.running += 1;

        try {
            const result: unknown = entry.run();

            if (!isPromiseLike(result)) {
                this.settle(entry, (): void => {
                    entry.resolve(result);
                });

                return;
            }

            Promise.resolve(result).then(
                (value: unknown): void => {
                    this.settle(entry, (): void => {
                        entry.resolve(value);
                    });
                },
                (reason: unknown): void => {
                    this.settle(entry, (): void => {
                        entry.reject(reason);
                    });
                },
            );
        } catch (error: unknown) {
            this.settle(entry, (): void => {
                entry.reject(error);
            });
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
