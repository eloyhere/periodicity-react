/**
 * Function that releases an acquired lock.
 * Type: type alias.
 * Fields: none.
 * @example
 * const release: Release = await mutex.acquire();
 */
export type Release = () => void;

/**
 * Cooperative mutex that serialises asynchronous critical sections.
 * Type: class.
 * @example
 * const mutex: Mutex = new Mutex();
 * await mutex.runExclusive(async (): Promise<void> => {
 *     await write();
 * });
 */
export class Mutex {
    private locked: boolean;
    private readonly waiters: Array<(release: Release) => void>;

    /**
     * Creates an unlocked mutex.
     * @example
     * const mutex: Mutex = new Mutex();
     * @returns A new Mutex.
     */
    constructor() {
        this.locked = false;
        this.waiters = [];
    }

    /**
     * Whether the mutex is currently held.
     * @example
     * const held: boolean = mutex.isLocked;
     * @returns True when a holder has not released the mutex.
     */
    public get isLocked(): boolean {
        return this.locked;
    }

    /**
     * Number of callers waiting for the mutex.
     * @example
     * const waiting: number = mutex.pending;
     * @returns The queue length.
     */
    public get pending(): number {
        return this.waiters.length;
    }

    /**
     * Acquires the mutex, resolving with a release function.
     * @example
     * const release: Release = await mutex.acquire();
     * release();
     * @returns A promise for the release function.
     */
    public acquire(): Promise<Release> {
        if (!this.locked) {
            this.locked = true;

            return Promise.resolve(this.release);
        }

        return new Promise<Release>((resolve: (release: Release) => void): void => {
            this.waiters.push(resolve);
        });
    }

    /**
     * Runs an action while holding the mutex.
     * @param action - Critical section to run; may be asynchronous.
     * @example
     * const value: number = await mutex.runExclusive(async (): Promise<number> => 1);
     * @returns The action result.
     */
    public async runExclusive<R>(action: () => R | Promise<R>): Promise<R> {
        const release: Release = await this.acquire();

        try {
            return await action();
        } finally {
            release();
        }
    }

    /**
     * Releases the mutex and wakes the next waiter, if any.
     * @example
     * this.release();
     * @returns Nothing.
     */
    private readonly release: Release = (): void => {
        const next: ((release: Release) => void) | void = this.waiters.shift();

        if (next === (void 0)) {
            this.locked = false;

            return;
        }

        next(this.release);
    };
}

export default Mutex;
