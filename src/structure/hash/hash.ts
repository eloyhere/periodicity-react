/**
 * Hashing primitives and least-rare-usage (LRU) containers.
 *
 * A hash is a `bigint` so a type tag can live in the high bits and a 64-bit
 * payload in the low bits, which keeps the categories collision-free:
 *
 *   null → 0, false → 1, true → 2, undefined → 3
 *   number   → tag 1 | IEEE-754 bits        (bit-exact, Object.is semantics)
 *   string   → tag 2 | FNV-1a 64            (content hash)
 *   bigint   → tag 3 | low 64 bits          (content hash)
 *   symbol   → tag 4 | registered key hash, or tag 4 | identity id
 *   object   → tag 5 | identity id          (weakly cached, GC-safe)
 *   tuple    → tag 6 | folded value hashes  (useHash(a, b, c))
 *
 * Identity hashes are stable for the lifetime of the target. Symbols are
 * strongly interned so their hash never changes; objects and functions are
 * interned weakly so they are never kept alive by the cache.
 */

/**
 * Hash value type: a bigint with a type tag in the high bits.
 * Type: type.
 * @example
 * const hash: Hash = useHash(target);
 */
export type Hash = bigint;

/**
 * Callable interface for `useHash`, overloaded by target type.
 * Type: interface.
 * @example
 * const hash: bigint = useHash(target);
 */
export interface UseHash {
    (target: null): bigint;
    (target: undefined): bigint;
    (target: boolean): bigint;
    (target: number): bigint;
    (target: bigint): bigint;
    (target: symbol): bigint;
    (target: CallableFunction): bigint;
    (target: object): bigint;
    (target: unknown, ...rest: unknown[]): bigint;
}

const NullHash: Hash = 0n;
const FalseHash: Hash = 1n;
const TrueHash: Hash = 2n;
const UndefinedHash: Hash = 3n;

const NumberTag: Hash = 1n << 64n;
const StringTag: Hash = 2n << 64n;
const BigIntTag: Hash = 3n << 64n;
const SymbolTag: Hash = 4n << 64n;
const IdentityTag: Hash = 5n << 64n;
const TupleTag: Hash = 6n << 64n;

const RegisteredSymbolTag: Hash = 1n << 63n;
const Mask64: Hash = 0xffffffffffffffffn;

const FnvOffset: Hash = 0xcbf29ce484222325n;
const FnvPrime: Hash = 0x100000001b3n;

const NumberBuffer: ArrayBuffer = new ArrayBuffer(8);
const NumberView: DataView = new DataView(NumberBuffer);

/**
 * Normalises a capacity; zero or less becomes unlimited.
 * @param capacity - Maximum number of entries; zero or less means unlimited.
 * @example
 * const result = normalizeCapacity(capacity);
 * @returns The normalised capacity.
 */
const normalizeCapacity: (capacity: number) => number = (capacity: number): number =>
    capacity > 0 ? capacity : Infinity;

/**
 * Computes the FNV-1a 64-bit hash of a string.
 * @param value - Value or element to store.
 * @example
 * const result = fnv1a(value);
 * @returns The 64-bit hash payload.
 */
const fnv1a: (value: string) => Hash = (value: string): Hash => {
    let hash: Hash = FnvOffset;

    for (let index: number = 0; index < value.length; index += 1) {
        hash = (hash ^ BigInt(value.charCodeAt(index))) & Mask64;
        hash = (hash * FnvPrime) & Mask64;
    }

    return hash;
};

/**
 * Hashes a number by its IEEE-754 bit pattern.
 * @param target - Value to hash.
 * @example
 * const result = hashNumber(target);
 * @returns A tagged hash.
 */
const hashNumber: (target: number) => Hash = (target: number): Hash => {
    NumberView.setFloat64(0, target, false);

    const high: Hash = BigInt(NumberView.getUint32(0, false));
    const low: Hash = BigInt(NumberView.getUint32(4, false));

    return NumberTag | (high << 32n) | low;
};

/**
 * Hashes a string by content.
 * @param target - Value to hash.
 * @example
 * const result = hashString(target);
 * @returns A tagged hash.
 */
const hashString: (target: string) => Hash = (target: string): Hash => StringTag | fnv1a(target);

/**
 * Hashes a bigint by its low 64 bits.
 * @param target - Value to hash.
 * @example
 * const result = hashBigInt(target);
 * @returns A tagged hash.
 */
const hashBigInt: (target: bigint) => Hash = (target: bigint): Hash =>
    BigIntTag | (target & Mask64);

/**
 * Internal entry for the strong least-recently-used registry.
 * Type: interface.
 * @param key - Key of the entry.
 * @param value - Stored value.
 * @param usedAt - Usage clock value.
 * @example
 * const entry: UsageEntry<string, number> = { key: "a", value: 1, usedAt: 1n };
 */
interface UsageEntry<K, V> {
    key: K;
    value: V;
    usedAt: bigint;
}

/**
 * Bounded least-recently-used map backed by a native Map and Array.
 * Type: class.
 * @param capacity - Maximum number of entries; zero or less means unlimited.
 * @example
 * const instance = new LeastRareUsageList(1024);
 */
class LeastRareUsageList<K, V> {
    private readonly records: Array<UsageEntry<K, V>>;
    private readonly index: Map<K, UsageEntry<K, V>>;
    private clock: bigint;
    private capacity: number;

    /**
     * Creates a new LeastRareUsageList.
     * @param capacity - Maximum number of entries; zero or less means unlimited.
     * @example
     * const instance = new LeastRareUsageList(1024);
     * @returns A new instance.
     */
    constructor(capacity: number = 1024) {
        this.records = [];
        this.index = new Map<K, UsageEntry<K, V>>();
        this.clock = 0n;
        this.capacity = normalizeCapacity(capacity);
    }

    /**
     * Number of entries currently stored.
     * @example
     * const count: number = instance.size;
     * @returns Number of entries.
     */
    public get size(): number {
        return this.index.size;
    }

    /**
     * Checks whether the key or element is present.
     * @param key - Key to look up.
     * @example
     * const result: boolean = instance.has(key);
     * @returns True when it is present.
     */
    public has(key: K): boolean {
        return this.index.has(key);
    }

    /**
     * Reads the value for `key` without touching its usage time.
     * @param key - Key to look up.
     * @example
     * const result = instance.peek(key);
     * @returns The stored value, or (void 0) when absent.
     */
    public peek(key: K): V | void {
        const entry: UsageEntry<K, V> | void = this.index.get(key);

        return entry === (void 0) ? (void 0) : entry.value;
    }

    /**
     * Reads the value for `key` and marks it as most recently used.
     * @param key - Key to look up.
     * @example
     * const result = instance.get(key);
     * @returns The stored value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const entry: UsageEntry<K, V> | void = this.index.get(key);

        if (entry === (void 0)) {
            return (void 0);
        }

        entry.usedAt = this.tick();

        return entry.value;
    }

    /**
     * Stores `value` under `key`; evicts the least recently used entry when full.
     * @param key - Key to look up.
     * @param value - Value or element to store.
     * @example
     * const result = instance.set(key, value);
     * @returns This instance, for chaining.
     */
    public set(key: K, value: V): this {
        const entry: UsageEntry<K, V> | void = this.index.get(key);

        if (entry === (void 0)) {
            const created: UsageEntry<K, V> = { key, value, usedAt: this.tick() };
            this.records.push(created);
            this.index.set(key, created);
        } else {
            entry.value = value;
            entry.usedAt = this.tick();
        }

        this.trim();

        return this;
    }

    /**
     * Removes the entry and its usage record.
     * @param key - Key to look up.
     * @example
     * const result: boolean = instance.delete(key);
     * @returns True when the entry was removed.
     */
    public delete(key: K): boolean {
        const entry: UsageEntry<K, V> | void = this.index.get(key);

        if (entry === (void 0)) {
            return false;
        }

        this.index.delete(key);
        this.remove(entry);

        return true;
    }

    /**
     * Removes every entry and resets the usage clock.
     * @example
     * instance.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.records.length = 0;
        this.index.clear();
    }

    /**
     * Changes the capacity and trims immediately.
     * @param capacity - Maximum number of entries; zero or less means unlimited.
     * @example
     * const result = instance.resize(capacity);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.capacity = normalizeCapacity(capacity);
        this.trim();

        return this;
    }

    /**
     * Returns keys ordered from least to most recently used.
     * @example
     * const result = instance.keys();
     * @returns A snapshot of keys.
     */
    public keys(): K[] {
        return this.sorted().map((entry: UsageEntry<K, V>): K => entry.key);
    }

    /**
     * Returns values ordered from least to most recently used.
     * @example
     * const result = instance.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        return this.sorted().map((entry: UsageEntry<K, V>): V => entry.value);
    }

    /**
     * Returns key-value pairs ordered from least to most recently used.
     * @example
     * const result = instance.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        return this.sorted().map(
            (entry: UsageEntry<K, V>): readonly [K, V] => [entry.key, entry.value] as const,
        );
    }

    /**
     * Returns the key-value pair at `index`, ordered from least to most recently used.
     * @param index - Zero-based position ordered by usage time.
     * @example
     * const result = instance.at(index);
     * @returns The key-value pair, or (void 0) when absent.
     */
    public at(index: number): readonly [K, V] | void {
        const entry: UsageEntry<K, V> | void = this.sorted()[index];

        return entry === (void 0) ? (void 0) : ([entry.key, entry.value] as const);
    }

    /**
     * Removes and returns the least recently used entry.
     * @example
     * const result = instance.shift();
     * @returns The key-value pair, or (void 0) when absent.
     */
    public shift(): readonly [K, V] | void {
        const entry: UsageEntry<K, V> | void = this.least();

        if (entry === (void 0)) {
            return (void 0);
        }

        this.delete(entry.key);

        return [entry.key, entry.value] as const;
    }

    /**
     * Advances and returns the internal usage clock.
     * @example
     * const result = this.tick();
     * @returns The updated usage clock value.
     */
    private tick(): bigint {
        this.clock += 1n;

        return this.clock;
    }

    /**
     * Returns a snapshot of records sorted by usage time, oldest first.
     * @example
     * const result = this.sorted();
     * @returns A snapshot of records.
     */
    private sorted(): Array<UsageEntry<K, V>> {
        return this.records
            .slice()
            .sort((first: UsageEntry<K, V>, second: UsageEntry<K, V>): number => {
                if (first.usedAt < second.usedAt) {
                    return -1;
                }

                if (first.usedAt > second.usedAt) {
                    return 1;
                }

                return 0;
            });
    }

    /**
     * Finds the record with the oldest usage time.
     * @example
     * const result = this.least();
     * @returns The oldest record, or (void 0) when empty.
     */
    private least(): UsageEntry<K, V> | void {
        let found: UsageEntry<K, V> | void = (void 0);

        this.records.forEach((entry: UsageEntry<K, V>): void => {
            if (found === (void 0) || entry.usedAt < found.usedAt) {
                found = entry;
            }
        });

        return found;
    }

    /**
     * Removes a record from the internal record list.
     * @param entry - Internal usage record.
     * @param V> - V>.
     * @example
     * this.remove(entry, V>);
     * @returns Nothing.
     */
    private remove(entry: UsageEntry<K, V>): void {
        const position: number = this.records.indexOf(entry);

        if (position >= 0) {
            this.records.splice(position, 1);
        }
    }

    /**
     * Evicts the least recently used entries until within capacity.
     * @example
     * this.trim();
     * @returns Nothing.
     */
    private trim(): void {
        while (this.index.size > this.capacity) {
            const victim: UsageEntry<K, V> | void = this.least();

            if (victim === (void 0)) {
                break;
            }

            this.delete(victim.key);
        }
    }
}

/**
 * Bounded least-recently-used set backed by a native Set.
 * Type: class.
 * @param capacity - Maximum number of entries; zero or less means unlimited.
 * @example
 * const instance = new LeastRareUsageSet(1024);
 */
class LeastRareUsageSet<T> {
    private readonly store: Set<T>;
    private capacity: number;

    /**
     * Creates a new LeastRareUsageSet.
     * @param capacity - Maximum number of entries; zero or less means unlimited.
     * @example
     * const instance = new LeastRareUsageSet(1024);
     * @returns A new instance.
     */
    constructor(capacity: number = 1024) {
        this.store = new Set<T>();
        this.capacity = normalizeCapacity(capacity);
    }

    /**
     * Number of entries currently stored.
     * @example
     * const count: number = instance.size;
     * @returns Number of entries.
     */
    public get size(): number {
        return this.store.size;
    }

    /**
     * Checks whether the key or element is present.
     * @param value - Value or element to store.
     * @example
     * const result: boolean = instance.has(value);
     * @returns True when it is present.
     */
    public has(value: T): boolean {
        return this.store.has(value);
    }

    /**
     * Adds the value and marks it as most recently used; evicts the oldest when full.
     * @param value - Value or element to store.
     * @example
     * const result = instance.add(value);
     * @returns This instance, for chaining.
     */
    public add(value: T): this {
        if (this.store.has(value)) {
            this.store.delete(value);
        }

        this.store.add(value);
        this.trim();

        return this;
    }

    /**
     * Removes the entry and its usage record.
     * @param value - Value or element to store.
     * @example
     * const result: boolean = instance.delete(value);
     * @returns True when the entry was removed.
     */
    public delete(value: T): boolean {
        return this.store.delete(value);
    }

    /**
     * Removes every entry and resets the usage clock.
     * @example
     * instance.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.store.clear();
    }

    /**
     * Changes the capacity and trims immediately.
     * @param capacity - Maximum number of entries; zero or less means unlimited.
     * @example
     * const result = instance.resize(capacity);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.capacity = normalizeCapacity(capacity);
        this.trim();

        return this;
    }

    /**
     * Returns values ordered from least to most recently used.
     * @example
     * const result = instance.values();
     * @returns A snapshot of values.
     */
    public values(): T[] {
        return Array.from(this.store);
    }

    /**
     * Returns the key-value pair at `index`, ordered from least to most recently used.
     * @param index - Zero-based position ordered by usage time.
     * @example
     * const result = instance.at(index);
     * @returns The stored value, or (void 0) when absent.
     */
    public at(index: number): T | void {
        return this.values()[index];
    }

    /**
     * Removes and returns the least recently used entry.
     * @example
     * const result = instance.shift();
     * @returns The stored value, or (void 0) when absent.
     */
    public shift(): T | void {
        const iterator: Iterator<T> = this.store.values();
        const oldest: IteratorResult<T> = iterator.next();

        if (oldest.done === true) {
            return (void 0);
        }

        this.store.delete(oldest.value);

        return oldest.value;
    }

    /**
     * Evicts the least recently used entries until within capacity.
     * @example
     * this.trim();
     * @returns Nothing.
     */
    private trim(): void {
        while (this.store.size > this.capacity) {
            const shifted: T | void = this.shift();

            if (shifted === (void 0)) {
                break;
            }
        }
    }
}

/**
 * Internal entry for the weak least-recently-used registry.
 * Type: interface.
 * @param reference - Weak reference to the key.
 * @param value - Stored value.
 * @param usedAt - Usage clock value.
 * @example
 * const entry: WeakUsageEntry<object, string> = { reference: new WeakRef(key), value: "v", usedAt: 1n };
 */
interface WeakUsageEntry<K extends object, V> {
    reference: WeakRef<K>;
    value: V;
    usedAt: bigint;
}

/**
 * Weakly keyed least-recently-used map whose records hold only WeakRefs.
 * Type: class.
 * @param capacity - Maximum number of entries; zero or less means unlimited.
 * @example
 * const instance = new WeakLeastRareUsageList(1024);
 */
class WeakLeastRareUsageList<K extends object, V> {
    private index: WeakMap<K, WeakUsageEntry<K, V>>;
    private records: Array<WeakUsageEntry<K, V>>;
    private clock: bigint;
    private capacity: number;
    private additions: number;

    /**
     * Creates a new WeakLeastRareUsageList.
     * @param capacity - Maximum number of entries; zero or less means unlimited.
     * @example
     * const instance = new WeakLeastRareUsageList(1024);
     * @returns A new instance.
     */
    constructor(capacity: number = 0) {
        this.index = new WeakMap<K, WeakUsageEntry<K, V>>();
        this.records = [];
        this.clock = 0n;
        this.capacity = normalizeCapacity(capacity);
        this.additions = 0;
    }

    /**
     * Number of entries currently stored.
     * @example
     * const count: number = instance.size;
     * @returns Number of entries.
     */
    public get size(): number {
        this.prune();

        return this.records.length;
    }

    /**
     * Checks whether the key or element is present.
     * @param key - Key to look up.
     * @example
     * const result: boolean = instance.has(key);
     * @returns True when it is present.
     */
    public has(key: K): boolean {
        const entry: WeakUsageEntry<K, V> | void = this.index.get(key);

        return entry !== (void 0) && entry.reference.deref() !== (void 0);
    }

    /**
     * Reads the value for `key` without touching its usage time.
     * @param key - Key to look up.
     * @example
     * const result = instance.peek(key);
     * @returns The stored value, or (void 0) when absent.
     */
    public peek(key: K): V | void {
        const entry: WeakUsageEntry<K, V> | void = this.index.get(key);

        if (entry === (void 0) || entry.reference.deref() === (void 0)) {
            return (void 0);
        }

        return entry.value;
    }

    /**
     * Reads the value for `key` and marks it as most recently used.
     * @param key - Key to look up.
     * @example
     * const result = instance.get(key);
     * @returns The stored value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const entry: WeakUsageEntry<K, V> | void = this.index.get(key);

        if (entry === (void 0)) {
            return (void 0);
        }

        if (entry.reference.deref() === (void 0)) {
            this.index.delete(key);
            this.remove(entry);

            return (void 0);
        }

        entry.usedAt = this.tick();

        return entry.value;
    }

    /**
     * Stores `value` under `key`; evicts the least recently used entry when full.
     * @param key - Key to look up.
     * @param value - Value or element to store.
     * @example
     * const result = instance.set(key, value);
     * @returns This instance, for chaining.
     */
    public set(key: K, value: V): this {
        const entry: WeakUsageEntry<K, V> | void = this.index.get(key);

        if (entry === (void 0)) {
            const created: WeakUsageEntry<K, V> = {
                reference: new WeakRef<K>(key),
                value,
                usedAt: this.tick(),
            };

            this.records.push(created);
            this.index.set(key, created);
            this.additions += 1;
        } else {
            entry.value = value;
            entry.usedAt = this.tick();
        }

        this.compact();
        this.trim();

        return this;
    }

    /**
     * Removes the entry and its usage record.
     * @param key - Key to look up.
     * @example
     * const result: boolean = instance.delete(key);
     * @returns True when the entry was removed.
     */
    public delete(key: K): boolean {
        const entry: WeakUsageEntry<K, V> | void = this.index.get(key);

        if (entry === (void 0)) {
            return false;
        }

        this.index.delete(key);
        this.remove(entry);

        return true;
    }

    /**
     * Removes every entry and resets the usage clock.
     * @example
     * instance.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.index = new WeakMap<K, WeakUsageEntry<K, V>>();
        this.records = [];
        this.additions = 0;
    }

    /**
     * Changes the capacity and trims immediately.
     * @param capacity - Maximum number of entries; zero or less means unlimited.
     * @example
     * const result = instance.resize(capacity);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.capacity = normalizeCapacity(capacity);
        this.trim();

        return this;
    }

    /**
     * Returns keys ordered from least to most recently used.
     * @example
     * const result = instance.keys();
     * @returns A snapshot of keys.
     */
    public keys(): K[] {
        const result: K[] = [];

        this.sorted().forEach((entry: WeakUsageEntry<K, V>): void => {
            const target: K | void = entry.reference.deref();

            if (target !== (void 0)) {
                result.push(target);
            }
        });

        return result;
    }

    /**
     * Returns values ordered from least to most recently used.
     * @example
     * const result = instance.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        const result: V[] = [];

        this.sorted().forEach((entry: WeakUsageEntry<K, V>): void => {
            if (entry.reference.deref() !== (void 0)) {
                result.push(entry.value);
            }
        });

        return result;
    }

    /**
     * Returns key-value pairs ordered from least to most recently used.
     * @example
     * const result = instance.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        const result: Array<readonly [K, V]> = [];

        this.sorted().forEach((entry: WeakUsageEntry<K, V>): void => {
            const target: K | void = entry.reference.deref();

            if (target !== (void 0)) {
                result.push([target, entry.value] as const);
            }
        });

        return result;
    }

    /**
     * Returns the key-value pair at `index`, ordered from least to most recently used.
     * @param index - Zero-based position ordered by usage time.
     * @example
     * const result = instance.at(index);
     * @returns The key-value pair, or (void 0) when absent.
     */
    public at(index: number): readonly [K, V] | void {
        const entry: WeakUsageEntry<K, V> | void = this.sorted()[index];

        if (entry === (void 0)) {
            return (void 0);
        }

        const target: K | void = entry.reference.deref();

        return target === (void 0) ? (void 0) : ([target, entry.value] as const);
    }

    /**
     * Removes and returns the least recently used entry.
     * @example
     * const result = instance.shift();
     * @returns The key-value pair, or (void 0) when absent.
     */
    public shift(): readonly [K, V] | void {
        this.prune();

        const entry: WeakUsageEntry<K, V> | void = this.least();

        if (entry === (void 0)) {
            return (void 0);
        }

        const target: K | void = entry.reference.deref();

        if (target === (void 0)) {
            return (void 0);
        }

        this.index.delete(target);
        this.remove(entry);

        return [target, entry.value] as const;
    }

    /**
     * Advances and returns the internal usage clock.
     * @example
     * const result = this.tick();
     * @returns The updated usage clock value.
     */
    private tick(): bigint {
        this.clock += 1n;

        return this.clock;
    }

    /**
     * Prunes dead weak references every 256 additions.
     * @example
     * this.compact();
     * @returns Nothing.
     */
    private compact(): void {
        if (this.additions % 256 === 0) {
            this.prune();
        }
    }

    /**
     * Drops records whose weak reference has been collected.
     * @example
     * this.prune();
     * @returns Nothing.
     */
    private prune(): void {
        this.records = this.records.filter(
            (entry: WeakUsageEntry<K, V>): boolean => entry.reference.deref() !== (void 0),
        );
    }

    /**
     * Returns a snapshot of records sorted by usage time, oldest first.
     * @example
     * const result = this.sorted();
     * @returns A snapshot of records.
     */
    private sorted(): Array<WeakUsageEntry<K, V>> {
        this.prune();

        return this.records
            .slice()
            .sort((first: WeakUsageEntry<K, V>, second: WeakUsageEntry<K, V>): number => {
                if (first.usedAt < second.usedAt) {
                    return -1;
                }

                if (first.usedAt > second.usedAt) {
                    return 1;
                }

                return 0;
            });
    }

    /**
     * Finds the record with the oldest usage time.
     * @example
     * const result = this.least();
     * @returns The oldest record, or (void 0) when empty.
     */
    private least(): WeakUsageEntry<K, V> | void {
        let found: WeakUsageEntry<K, V> | void = (void 0);

        this.records.forEach((entry: WeakUsageEntry<K, V>): void => {
            if (entry.reference.deref() === (void 0)) {
                return;
            }

            if (found === (void 0) || entry.usedAt < found.usedAt) {
                found = entry;
            }
        });

        return found;
    }

    /**
     * Removes a record from the internal record list.
     * @param entry - Internal usage record.
     * @param V> - V>.
     * @example
     * this.remove(entry, V>);
     * @returns Nothing.
     */
    private remove(entry: WeakUsageEntry<K, V>): void {
        const position: number = this.records.indexOf(entry);

        if (position >= 0) {
            this.records.splice(position, 1);
        }
    }

    /**
     * Evicts the least recently used entries until within capacity.
     * @example
     * this.trim();
     * @returns Nothing.
     */
    private trim(): void {
        this.prune();

        while (this.records.length > this.capacity) {
            const victim: WeakUsageEntry<K, V> | void = this.least();

            if (victim === (void 0)) {
                break;
            }

            const target: K | void = victim.reference.deref();

            if (target !== (void 0)) {
                this.index.delete(target);
            }

            this.remove(victim);
        }
    }
}

/**
 * Internal entry for the weak least-recently-used set.
 * Type: interface.
 * @param reference - Weak reference to the element.
 * @param usedAt - Usage clock value.
 * @example
 * const entry: WeakSetEntry<object> = { reference: new WeakRef(value), usedAt: 1n };
 */
interface WeakSetEntry<T extends object> {
    reference: WeakRef<T>;
    usedAt: bigint;
}

/**
 * Weakly held least-recently-used set whose records hold only WeakRefs.
 * Type: class.
 * @param capacity - Maximum number of entries; zero or less means unlimited.
 * @example
 * const instance = new WeakLeastRareUsageSet(1024);
 */
class WeakLeastRareUsageSet<T extends object> {
    private store: WeakSet<T>;
    private records: Array<WeakSetEntry<T>>;
    private clock: bigint;
    private capacity: number;
    private additions: number;

    /**
     * Creates a new WeakLeastRareUsageSet.
     * @param capacity - Maximum number of entries; zero or less means unlimited.
     * @example
     * const instance = new WeakLeastRareUsageSet(1024);
     * @returns A new instance.
     */
    constructor(capacity: number = 0) {
        this.store = new WeakSet<T>();
        this.records = [];
        this.clock = 0n;
        this.capacity = normalizeCapacity(capacity);
        this.additions = 0;
    }

    /**
     * Number of entries currently stored.
     * @example
     * const count: number = instance.size;
     * @returns Number of entries.
     */
    public get size(): number {
        this.prune();

        return this.records.length;
    }

    /**
     * Checks whether the key or element is present.
     * @param value - Value or element to store.
     * @example
     * const result: boolean = instance.has(value);
     * @returns True when it is present.
     */
    public has(value: T): boolean {
        return this.store.has(value);
    }

    /**
     * Adds the value and marks it as most recently used; evicts the oldest when full.
     * @param value - Value or element to store.
     * @example
     * const result = instance.add(value);
     * @returns This instance, for chaining.
     */
    public add(value: T): this {
        this.store.add(value);

        const existing: WeakSetEntry<T> | void = this.find(value);

        if (existing === (void 0)) {
            this.records.push({ reference: new WeakRef<T>(value), usedAt: this.tick() });
            this.additions += 1;
        } else {
            existing.usedAt = this.tick();
        }

        this.compact();
        this.trim();

        return this;
    }

    /**
     * Removes the entry and its usage record.
     * @param value - Value or element to store.
     * @example
     * const result: boolean = instance.delete(value);
     * @returns True when the entry was removed.
     */
    public delete(value: T): boolean {
        const deleted: boolean = this.store.delete(value);
        const existing: WeakSetEntry<T> | void = this.find(value);

        if (existing !== (void 0)) {
            this.remove(existing);
        }

        return deleted;
    }

    /**
     * Removes every entry and resets the usage clock.
     * @example
     * instance.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.store = new WeakSet<T>();
        this.records = [];
        this.additions = 0;
    }

    /**
     * Changes the capacity and trims immediately.
     * @param capacity - Maximum number of entries; zero or less means unlimited.
     * @example
     * const result = instance.resize(capacity);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.capacity = normalizeCapacity(capacity);
        this.trim();

        return this;
    }

    /**
     * Returns values ordered from least to most recently used.
     * @example
     * const result = instance.values();
     * @returns A snapshot of values.
     */
    public values(): T[] {
        const result: T[] = [];

        this.sorted().forEach((entry: WeakSetEntry<T>): void => {
            const target: T | void = entry.reference.deref();

            if (target !== (void 0)) {
                result.push(target);
            }
        });

        return result;
    }

    /**
     * Returns the key-value pair at `index`, ordered from least to most recently used.
     * @param index - Zero-based position ordered by usage time.
     * @example
     * const result = instance.at(index);
     * @returns The stored value, or (void 0) when absent.
     */
    public at(index: number): T | void {
        return this.values()[index];
    }

    /**
     * Removes and returns the least recently used entry.
     * @example
     * const result = instance.shift();
     * @returns The stored value, or (void 0) when absent.
     */
    public shift(): T | void {
        this.prune();

        const entry: WeakSetEntry<T> | void = this.least();

        if (entry === (void 0)) {
            return (void 0);
        }

        const target: T | void = entry.reference.deref();

        if (target === (void 0)) {
            return (void 0);
        }

        this.store.delete(target);
        this.remove(entry);

        return target;
    }

    /**
     * Advances and returns the internal usage clock.
     * @example
     * const result = this.tick();
     * @returns The updated usage clock value.
     */
    private tick(): bigint {
        this.clock += 1n;

        return this.clock;
    }

    /**
     * Prunes dead weak references every 256 additions.
     * @example
     * this.compact();
     * @returns Nothing.
     */
    private compact(): void {
        if (this.additions % 256 === 0) {
            this.prune();
        }
    }

    /**
     * Finds the weak record that refers to the given value.
     * @param value - Value or element to store.
     * @example
     * const result = this.find(value);
     * @returns The oldest record, or (void 0) when empty.
     */
    private find(value: T): WeakSetEntry<T> | void {
        let found: WeakSetEntry<T> | void = (void 0);

        this.records.forEach((entry: WeakSetEntry<T>): void => {
            if (entry.reference.deref() === value) {
                found = entry;
            }
        });

        return found;
    }

    /**
     * Drops records whose weak reference has been collected.
     * @example
     * this.prune();
     * @returns Nothing.
     */
    private prune(): void {
        this.records = this.records.filter(
            (entry: WeakSetEntry<T>): boolean => entry.reference.deref() !== (void 0),
        );
    }

    /**
     * Returns a snapshot of records sorted by usage time, oldest first.
     * @example
     * const result = this.sorted();
     * @returns A snapshot of records.
     */
    private sorted(): Array<WeakSetEntry<T>> {
        this.prune();

        return this.records
            .slice()
            .sort((first: WeakSetEntry<T>, second: WeakSetEntry<T>): number => {
                if (first.usedAt < second.usedAt) {
                    return -1;
                }

                if (first.usedAt > second.usedAt) {
                    return 1;
                }

                return 0;
            });
    }

    /**
     * Finds the record with the oldest usage time.
     * @example
     * const result = this.least();
     * @returns The oldest record, or (void 0) when empty.
     */
    private least(): WeakSetEntry<T> | void {
        let found: WeakSetEntry<T> | void = (void 0);

        this.records.forEach((entry: WeakSetEntry<T>): void => {
            if (entry.reference.deref() === (void 0)) {
                return;
            }

            if (found === (void 0) || entry.usedAt < found.usedAt) {
                found = entry;
            }
        });

        return found;
    }

    /**
     * Removes a record from the internal record list.
     * @param entry - Internal usage record.
     * @example
     * this.remove(entry);
     * @returns Nothing.
     */
    private remove(entry: WeakSetEntry<T>): void {
        const position: number = this.records.indexOf(entry);

        if (position >= 0) {
            this.records.splice(position, 1);
        }
    }

    /**
     * Evicts the least recently used entries until within capacity.
     * @example
     * this.trim();
     * @returns Nothing.
     */
    private trim(): void {
        this.prune();

        while (this.records.length > this.capacity) {
            const victim: WeakSetEntry<T> | void = this.least();

            if (victim === (void 0)) {
                break;
            }

            const target: T | void = victim.reference.deref();

            if (target !== (void 0)) {
                this.store.delete(target);
            }

            this.remove(victim);
        }
    }
}

const SymbolCapacity: number = 4096;
const HashCapacity: number = 8192;

const SymbolHashes: LeastRareUsageList<symbol, Hash> = new LeastRareUsageList<symbol, Hash>(0);
const IssuedHashes: LeastRareUsageSet<Hash> = new LeastRareUsageSet<Hash>(HashCapacity);
const ObjectHashes: WeakLeastRareUsageList<object, Hash> = new WeakLeastRareUsageList<object, Hash>(0);
const IssuedObjects: WeakLeastRareUsageSet<object> = new WeakLeastRareUsageSet<object>(0);

let identityClock: bigint = 0n;

/**
 * Evicts the oldest registered symbols until another one fits.
 * @example
 * evictSymbols();
 * @returns Nothing.
 */
const evictSymbols: () => void = (): void => {
    while (SymbolHashes.size >= SymbolCapacity) {
        const evicted: readonly [symbol, Hash] | void = SymbolHashes.shift();

        if (evicted === (void 0)) {
            return;
        }

        IssuedHashes.delete(evicted[1]);
    }
};

/**
 * Registers a symbol and its hash.
 * @param target - The symbol to register.
 * @param hash - The hash assigned to the symbol.
 * @example
 * registerSymbol(Symbol("id"), hash);
 * @returns Nothing.
 */
const registerSymbol: (target: symbol, hash: Hash) => void = (
    target: symbol,
    hash: Hash,
): void => {
    evictSymbols();
    SymbolHashes.set(target, hash);
    IssuedHashes.add(hash);
};

/**
 * Unregisters a target so a later call assigns a fresh identity.
 * @param target - The symbol or object to unregister.
 * @example
 * unregisterHash(target);
 * @returns True when the target was registered.
 */
export const unregisterHash: (target: unknown) => boolean = (target: unknown): boolean => {
    if (typeof(target) === "symbol") {
        const hash: Hash | void = SymbolHashes.peek(target);

        if (hash === (void 0)) {
            return false;
        }

        SymbolHashes.delete(target);
        IssuedHashes.delete(hash);

        return true;
    }

    if (typeof(target) === "object" && target !== null) {
        if (!IssuedObjects.has(target)) {
            return false;
        }

        ObjectHashes.delete(target);
        IssuedObjects.delete(target);

        return true;
    }

    return false;
};

/**
 * Hashes a symbol, using its registered key when available.
 * @param target - The symbol to hash.
 * @example
 * const hash: Hash = hashSymbol(Symbol.for("periodicity"));
 * @returns A tagged symbol hash.
 */
const hashSymbol: (target: symbol) => Hash = (target: symbol): Hash => {
    const cached: Hash | void = SymbolHashes.get(target);

    if (cached !== (void 0)) {
        return cached;
    }

    identityClock += 1n;

    const registered: string | void = Symbol.keyFor(target);
    const hash: Hash =
        registered === (void 0)
            ? SymbolTag | identityClock
            : SymbolTag | RegisteredSymbolTag | fnv1a(registered);

    registerSymbol(target, hash);

    return hash;
};

/**
 * Hashes an object or function by identity, weakly cached.
 * @param target - The object or function to hash.
 * @example
 * const hash: Hash = hashIdentity(user);
 * @returns A tagged identity hash.
 */
const hashIdentity: (target: object) => Hash = (target: object): Hash => {
    const cached: Hash | void = ObjectHashes.get(target);

    if (cached !== (void 0)) {
        return cached;
    }

    identityClock += 1n;

    const hash: Hash = IdentityTag | identityClock;

    ObjectHashes.set(target, hash);
    IssuedObjects.add(target);

    return hash;
};

/**
 * Dispatches a single value to its hasher.
 * @param target - The value to hash.
 * @example
 * const hash: Hash = hashValue(target);
 * @returns A tagged hash.
 */
const hashValue: (target: unknown) => Hash = (target: unknown): Hash => {
    if (target === null) {
        return NullHash;
    }

    const kind: string = typeof(target);

    if (kind === "undefined") {
        return UndefinedHash;
    }

    if (kind === "boolean") {
        return target === true ? TrueHash : FalseHash;
    }

    if (kind === "number") {
        return hashNumber(target as number);
    }

    if (kind === "string") {
        return hashString(target as string);
    }

    if (kind === "bigint") {
        return hashBigInt(target as bigint);
    }

    if (kind === "symbol") {
        return hashSymbol(target as symbol);
    }

    return hashIdentity(target as object);
};

/**
 * Folds several hashes into an order-sensitive tuple hash.
 * @param hashes - The hashes to fold.
 * @example
 * const hash: Hash = combineHashes([hashValue(1), hashValue("a")]);
 * @returns A tagged tuple hash.
 */
const combineHashes: (hashes: Array<Hash>) => Hash = (hashes: Array<Hash>): Hash => {
    let payload: Hash = BigInt(hashes.length) & Mask64;

    hashes.forEach((hash: Hash): void => {
        payload = (payload * FnvPrime + (hash & Mask64)) & Mask64;
    });

    return TupleTag | payload;
};

/**
 * Hashes one or more values.
 * @param targets - The values to hash.
 * @example
 * const hash: Hash = hashTargets("a", 1, true);
 * @returns A tagged hash.
 */
const hashTargets: (...targets: Array<unknown>) => Hash = (
    ...targets: Array<unknown>
): Hash => {
    if (targets.length === 1) {
        return hashValue(targets[0]);
    }

    return combineHashes(targets.map((target: unknown): Hash => hashValue(target)));
};

/**
 * Returns a stable 64-bit tagged hash for any value.
 * @param target - The value to hash.
 * @param rest - Further values folded into a tuple hash.
 * @example
 * const hash: bigint = useHash({ id: 1 });
 * const tuple: bigint = useHash("a", 1, true);
 * @returns A stable bigint hash.
 */
export const useHash: UseHash = hashTargets as UseHash;

export default useHash;

