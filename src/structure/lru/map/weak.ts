import { normaliseCapacity } from "../internal";

/**
 * Internal record of a weakly keyed least-recently-used entry.
 *
 * The record holds the key only through a `WeakRef`, so tracking recency never keeps an otherwise unreachable key
 * alive. The linked list threads records from least to most recently used.
 * Type: interface.
 * @param reference - Weak reference to the key.
 * @param value - Cached value.
 * @param previous - Less recently used record, or (void 0) at the head.
 * @param next - More recently used record, or (void 0) at the tail.
 * @example
 * const record: WeakLeastRarelyUsageRecord<object, string> = {
 *     reference: new WeakRef(target),
 *     value: "v",
 *     previous: (void 0),
 *     next: (void 0),
 * };
 */
interface WeakLeastRarelyUsageRecord<K extends object, V> {
    reference: WeakRef<K>;
    value: V;
    previous: WeakLeastRarelyUsageRecord<K, V> | void;
    next: WeakLeastRarelyUsageRecord<K, V> | void;
}

/**
 * Shared weakly keyed least-recently-used implementation.
 *
 * Records are held in a doubly linked recency list and looked up through a `WeakMap`. Dead weak references are pruned
 * before snapshots and size queries; `keys`, `values`, `entries`, `at` and iteration therefore enumerate only keys that
 * are still reachable, and they temporarily retain those keys for the lifetime of the returned snapshot. Capacity is
 * enforced against live records only, so garbage collection can reduce the effective size without an explicit call.
 * Type: class.
 * @param capacity - Maximum number of live entries; positive whole numbers are floored and `Infinity` means unbounded.
 * @param ordered - Whether snapshots run from least to most recently used; `false` yields the reverse, unspecified.
 * @example
 * const cache: WeakLeastRarelyUsageMapBase<object, string> = new WeakLeastRarelyUsageMapBase<object, string>(16, true);
 */
class WeakLeastRarelyUsageMapBase<K extends object, V> {
    private index: WeakMap<K, WeakLeastRarelyUsageRecord<K, V>>;
    private head: WeakLeastRarelyUsageRecord<K, V> | void;
    private tail: WeakLeastRarelyUsageRecord<K, V> | void;
    private countValue: number;
    private capacityValue: number;
    private readonly ordered: boolean;

    /**
     * Creates an empty weakly keyed cache.
     * @param capacity - Maximum number of live entries; must be a positive whole number or `Infinity`.
     * @param ordered - Whether snapshots run from least to most recently used.
     * @example
     * const cache: WeakLeastRarelyUsageMapBase<object, string> =
     *     new WeakLeastRarelyUsageMapBase<object, string>(16, true);
     * @returns A new WeakLeastRarelyUsageMapBase instance.
     */
    protected constructor(capacity: number, ordered: boolean) {
        this.index = new WeakMap<K, WeakLeastRarelyUsageRecord<K, V>>();
        this.head = (void 0);
        this.tail = (void 0);
        this.countValue = 0;
        this.capacityValue = normaliseCapacity(capacity);
        this.ordered = ordered;
    }

    /**
     * Number of live entries after pruning collected weak references.
     * @example
     * const size: number = cache.size();
     * @returns The current live entry count.
     */
    public size(): number {
        this.prune();

        return this.countValue;
    }

    /**
     * Maximum number of live entries the cache may retain.
     * @example
     * const capacity: number = cache.capacity();
     * @returns The configured capacity, or `Infinity` when unbounded.
     */
    public capacity(): number {
        return this.capacityValue;
    }

    /**
     * Checks whether the cache has reached its capacity.
     * @example
     * const full: boolean = cache.isFull();
     * @returns True when no further entry can be inserted without eviction.
     */
    public isFull(): boolean {
        return this.size() >= this.capacityValue;
    }

    /**
     * Checks whether a key is present without changing its recency.
     * @param key - Key to look up.
     * @example
     * const present: boolean = cache.contains(target);
     * @returns True when the key is cached.
     */
    public contains(key: K): boolean {
        return this.index.has(key);
    }

    /**
     * Reads a value without changing the recency of its key.
     * @param key - Key to look up.
     * @example
     * const value: string | void = cache.peek(target);
     * @returns The cached value, or (void 0) when absent.
     */
    public peek(key: K): V | void {
        const record: WeakLeastRarelyUsageRecord<K, V> | void = this.index.get(key);

        if (record === (void 0)) {
            return (void 0);
        }

        if (record.reference.deref() === (void 0)) {
            this.drop(record);

            return (void 0);
        }

        return record.value;
    }

    /**
     * Checks whether a key is present and promotes it to the most-recent position.
     * @param key - Key to look up.
     * @example
     * const present: boolean = cache.has(target);
     * @returns True when the key is cached.
     */
    public has(key: K): boolean {
        const record: WeakLeastRarelyUsageRecord<K, V> | void = this.index.get(key);

        if (record === (void 0)) {
            return false;
        }

        if (record.reference.deref() === (void 0)) {
            this.drop(record);

            return false;
        }

        this.touch(record);

        return true;
    }

    /**
     * Reads a value and promotes its key to the most-recent position.
     * @param key - Key to look up.
     * @example
     * const value: string | void = cache.get(target);
     * @returns The cached value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const record: WeakLeastRarelyUsageRecord<K, V> | void = this.index.get(key);

        if (record === (void 0)) {
            return (void 0);
        }

        if (record.reference.deref() === (void 0)) {
            this.drop(record);

            return (void 0);
        }

        this.touch(record);

        return record.value;
    }

    /**
     * Inserts or updates an entry, promotes it to the most-recent position and evicts the least recently used live
     * entry when the capacity has been exceeded.
     * @param key - Object key to store.
     * @param value - Value to store.
     * @example
     * cache.set(target, "v");
     * @returns This instance, for chaining.
     */
    public set(key: K, value: V): this {
        const existing: WeakLeastRarelyUsageRecord<K, V> | void = this.index.get(key);

        if (existing !== (void 0)) {
            existing.value = value;
            this.touch(existing);

            return this;
        }

        const record: WeakLeastRarelyUsageRecord<K, V> = {
            reference: new WeakRef<K>(key),
            value,
            previous: this.tail,
            next: (void 0),
        };

        if (this.tail === (void 0)) {
            this.head = record;
        } else {
            this.tail.next = record;
        }

        this.tail = record;
        this.index.set(key, record);
        this.countValue += 1;
        this.trim();

        return this;
    }

    /**
     * Removes an entry and its recency record.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = cache.delete(target);
     * @returns True when the key was cached.
     */
    public delete(key: K): boolean {
        const record: WeakLeastRarelyUsageRecord<K, V> | void = this.index.get(key);

        if (record === (void 0)) {
            return false;
        }

        this.index.delete(key);
        this.unlink(record);
        this.countValue -= 1;

        return true;
    }

    /**
     * Removes every entry and recency record. The old `WeakMap` is replaced because weak maps have no `clear` method.
     * @example
     * cache.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.index = new WeakMap<K, WeakLeastRarelyUsageRecord<K, V>>();
        this.head = (void 0);
        this.tail = (void 0);
        this.countValue = 0;
    }

    /**
     * Changes the capacity and evicts the least recently used live entries until the new bound is satisfied.
     * @param capacity - New maximum number of live entries; must be a positive whole number or `Infinity`.
     * @example
     * cache.resize(8);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.capacityValue = normaliseCapacity(capacity);
        this.trim();

        return this;
    }

    /**
     * Returns the live keys in snapshot order.
     * @example
     * const keys: object[] = cache.keys();
     * @returns A snapshot of live keys; the caller's references keep them alive.
     */
    public keys(): K[] {
        return this.snapshot().map((record: WeakLeastRarelyUsageRecord<K, V>): K => record.reference.deref() as K);
    }

    /**
     * Returns the values of live keys in snapshot order.
     * @example
     * const values: string[] = cache.values();
     * @returns A snapshot of values whose keys are still reachable.
     */
    public values(): V[] {
        return this.snapshot().map((record: WeakLeastRarelyUsageRecord<K, V>): V => record.value);
    }

    /**
     * Returns key-value pairs of live keys in snapshot order.
     * @example
     * const entries: Array<readonly [object, string]> = cache.entries();
     * @returns A snapshot of live key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        return this.snapshot().map(
            (record: WeakLeastRarelyUsageRecord<K, V>): readonly [K, V] =>
                [record.reference.deref() as K, record.value] as const,
        );
    }

    /**
     * Reads the live entry at a snapshot position without changing recency.
     * @param position - Zero-based position in snapshot order.
     * @example
     * const entry: readonly [object, string] | void = cache.at(0);
     * @returns The key-value pair, or (void 0) when the position is out of range.
     */
    public at(position: number): readonly [K, V] | void {
        const records: Array<WeakLeastRarelyUsageRecord<K, V>> = this.snapshot();

        if (!Number.isInteger(position) || position < 0 || position >= records.length) {
            return (void 0);
        }

        const record: WeakLeastRarelyUsageRecord<K, V> = records[position];

        return [record.reference.deref() as K, record.value] as const;
    }

    /**
     * Removes and returns the least recently used live entry.
     * @example
     * const evicted: readonly [object, string] | void = cache.shift();
     * @returns The evicted key-value pair, or (void 0) when no live entry remains.
     */
    public shift(): readonly [K, V] | void {
        this.prune();

        while (this.head !== (void 0)) {
            const victim: WeakLeastRarelyUsageRecord<K, V> = this.head;
            const key: K | void = victim.reference.deref();

            if (key === (void 0)) {
                this.drop(victim);

                continue;
            }

            this.index.delete(key);
            this.unlink(victim);
            this.countValue -= 1;

            return [key, victim.value] as const;
        }

        return (void 0);
    }

    /**
     * Visits every live entry in snapshot order without changing recency.
     * @param callback - Called with the value and key.
     * @example
     * cache.forEach((value: string, key: object): void => {
     *     collected.push(value);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: V, key: K) => void): void {
        this.entries().forEach((entry: readonly [K, V]): void => {
            callback(entry[1], entry[0]);
        });
    }

    /**
     * Iterates live key-value pairs in snapshot order without changing recency.
     * @example
     * const entries: Array<[object, string]> = [...cache];
     * @returns An iterator over a snapshot of mutable key-value pairs.
     */
    public [Symbol.iterator](): IterableIterator<[K, V]> {
        const entries: Array<[K, V]> = this.entries().map(
            (entry: readonly [K, V]): [K, V] => [entry[0], entry[1]],
        );

        return entries.values();
    }

    /**
     * Moves a live record to the most-recent end of the recency list.
     * @param record - Record to promote.
     * @example
     * this.touch(record);
     * @returns Nothing.
     */
    private touch(record: WeakLeastRarelyUsageRecord<K, V>): void {
        if (this.tail === record) {
            return;
        }

        this.unlink(record);
        this.append(record);
    }

    /**
     * Appends a detached record at the most-recent end of the recency list.
     * @param record - Record to append.
     * @example
     * this.append(record);
     * @returns Nothing.
     */
    private append(record: WeakLeastRarelyUsageRecord<K, V>): void {
        record.previous = this.tail;
        record.next = (void 0);

        if (this.tail === (void 0)) {
            this.head = record;
        } else {
            this.tail.next = record;
        }

        this.tail = record;
    }

    /**
     * Removes a record from the recency list and clears both of its links.
     * @param record - Record to unlink.
     * @example
     * this.unlink(record);
     * @returns Nothing.
     */
    private unlink(record: WeakLeastRarelyUsageRecord<K, V>): void {
        const previous: WeakLeastRarelyUsageRecord<K, V> | void = record.previous;
        const next: WeakLeastRarelyUsageRecord<K, V> | void = record.next;

        if (previous === (void 0)) {
            this.head = next;
        } else {
            previous.next = next;
        }

        if (next === (void 0)) {
            this.tail = previous;
        } else {
            next.previous = previous;
        }

        record.previous = (void 0);
        record.next = (void 0);
    }

    /**
     * Removes a record whose key has been collected and decrements the live count.
     * @param record - Record whose weak reference is empty.
     * @example
     * this.drop(record);
     * @returns Nothing.
     */
    private drop(record: WeakLeastRarelyUsageRecord<K, V>): void {
        this.unlink(record);
        this.countValue -= 1;
    }

    /**
     * Drops every record whose weak reference has been cleared.
     * @example
     * this.prune();
     * @returns Nothing.
     */
    private prune(): void {
        let current: WeakLeastRarelyUsageRecord<K, V> | void = this.head;

        while (current !== (void 0)) {
            const next: WeakLeastRarelyUsageRecord<K, V> | void = current.next;

            if (current.reference.deref() === (void 0)) {
                this.unlink(current);
                this.countValue -= 1;
            }

            current = next;
        }
    }

    /**
     * Takes a pruned snapshot of the live records in the configured order.
     * @example
     * const records: Array<WeakLeastRarelyUsageRecord<object, string>> = this.snapshot();
     * @returns A snapshot of live records.
     */
    private snapshot(): Array<WeakLeastRarelyUsageRecord<K, V>> {
        this.prune();

        const records: Array<WeakLeastRarelyUsageRecord<K, V>> = [];
        let current: WeakLeastRarelyUsageRecord<K, V> | void = this.head;

        while (current !== (void 0)) {
            records.push(current);
            current = current.next;
        }

        return this.ordered ? records : records.reverse();
    }

    /**
     * Evicts the least recently used live records until the configured capacity is satisfied.
     * @example
     * this.trim();
     * @returns Nothing.
     */
    private trim(): void {
        this.prune();

        while (this.countValue > this.capacityValue && this.head !== (void 0)) {
            const victim: WeakLeastRarelyUsageRecord<K, V> = this.head;
            const key: K | void = victim.reference.deref();

            if (key !== (void 0)) {
                this.index.delete(key);
            }

            this.unlink(victim);
            this.countValue -= 1;
        }
    }
}

/**
 * Weakly keyed least-recently-used map with recency-ordered iteration.
 *
 * Keys are held only weakly, so an unreachable key can be collected at any time. `size` reports live records after
 * pruning and can therefore shrink without an explicit `delete`. `keys`, `values`, `entries`, `at`, `forEach` and
 * iteration enumerate only keys that are still reachable and run from least to most recently used; they never claim to
 * reveal a key that has already been collected. `get`, `has` and `set` refresh recency; `contains` and `peek` do not.
 * Type: class.
 * @param capacity - Maximum number of live entries; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const key: object = {};
 * const cache: WeakLeastRarelyUsageOrderedMap<object, string> =
 *     new WeakLeastRarelyUsageOrderedMap<object, string>(2);
 * cache.set(key, "v");
 * const value: string | void = cache.get(key);
 */
export class WeakLeastRarelyUsageOrderedMap<K extends object, V> extends WeakLeastRarelyUsageMapBase<K, V> {
    /**
     * Creates an empty weakly keyed recency-ordered map.
     * @param capacity - Maximum number of live entries; must be a positive whole number or `Infinity`.
     * @example
     * const cache: WeakLeastRarelyUsageOrderedMap<object, string> =
     *     new WeakLeastRarelyUsageOrderedMap<object, string>(16);
     * @returns A new WeakLeastRarelyUsageOrderedMap instance.
     */
    public constructor(capacity: number) {
        super(capacity, true);
    }
}

/**
 * Weakly keyed least-recently-used map without an iteration-order guarantee.
 *
 * Eviction, membership and value access behave exactly like {@link WeakLeastRarelyUsageOrderedMap}, but snapshots are
 * returned newest first and callers must not rely on any particular order. A key is still observable only while it is
 * reachable; collected keys are pruned rather than reported.
 * Type: class.
 * @param capacity - Maximum number of live entries; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const key: object = {};
 * const cache: WeakLeastRarelyUsageUnorderedMap<object, string> =
 *     new WeakLeastRarelyUsageUnorderedMap<object, string>(2);
 * cache.set(key, "v");
 * const size: number = cache.size();
 */
export class WeakLeastRarelyUsageUnorderedMap<K extends object, V> extends WeakLeastRarelyUsageMapBase<K, V> {
    /**
     * Creates an empty weakly keyed unordered map.
     * @param capacity - Maximum number of live entries; must be a positive whole number or `Infinity`.
     * @example
     * const cache: WeakLeastRarelyUsageUnorderedMap<object, string> =
     *     new WeakLeastRarelyUsageUnorderedMap<object, string>(16);
     * @returns A new WeakLeastRarelyUsageUnorderedMap instance.
     */
    public constructor(capacity: number) {
        super(capacity, false);
    }
}

export default WeakLeastRarelyUsageOrderedMap;
