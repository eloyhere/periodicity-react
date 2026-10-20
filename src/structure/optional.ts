import { invalidate, validate, type Nullable } from "./validation";

/**
 * Minimal optional container with safe factories and transformations.
 * Type: class.
 * @example
 * const value: Optional<number> = Optional.of(3);
 */
export class Optional<T> {
    private readonly value: Nullable<T>;

    private constructor(value: Nullable<T>) {
        this.value = value;
    }

    /**
     * Creates an empty optional.
     * @example
     * const empty: Optional<number> = Optional.empty();
     * @returns An empty optional.
     */
    public static empty<T = never>(): Optional<T> {
        return new Optional<T>((void 0));
    }

    /**
     * Creates an optional containing a value.
     * @param value - Non-null value.
     * @example
     * const present: Optional<number> = Optional.of(3);
     * @returns A present optional.
     */
    public static of<T>(value: T): Optional<T> {
        return new Optional<T>(value);
    }

    /**
     * Creates an optional from a nullable value.
     * @param value - Value that may be null or undefined.
     * @example
     * const optional: Optional<number> = Optional.ofNullable(maybeNumber);
     * @returns A present or empty optional.
     */
    public static ofNullable<T>(value: Nullable<T>): Optional<T> {
        return new Optional<T>(value);
    }

    /**
     * Checks whether the optional is empty.
     * @example
     * const empty: boolean = optional.isEmpty();
     * @returns True when empty.
     */
    public isEmpty(): boolean {
        return invalidate(this.value);
    }

    /**
     * Checks whether the optional contains a value.
     * @example
     * const present: boolean = optional.isPresent();
     * @returns True when present.
     */
    public isPresent(): boolean {
        return validate(this.value);
    }

    /**
     * Reads the contained value.
     * @example
     * const value: number = optional.get();
     * @returns The contained value.
     */
    public get(): T {
        if (invalidate(this.value)) {
            throw new Error("Optional is empty");
        }

        return this.value as T;
    }

    /**
     * Returns the value or a fallback.
     * @param fallback - Value used when empty.
     * @example
     * const value: number = optional.orElse(0);
     * @returns The value or fallback.
     */
    public orElse(fallback: T): T {
        return invalidate(this.value) ? fallback : (this.value as T);
    }

    /**
     * Returns the value or a lazily created fallback.
     * @param supplier - Factory used when empty.
     * @example
     * const value: number = optional.orElseGet(() => 0);
     * @returns The value or supplied fallback.
     */
    public orElseGet(supplier: () => T): T {
        return invalidate(this.value) ? supplier() : (this.value as T);
    }

    /**
     * Maps the contained value.
     * @param mapper - Transformation for a present value.
     * @example
     * const length: Optional<number> = optional.map((value) => value.length);
     * @returns A mapped optional.
     */
    public map<U>(mapper: (value: T) => U): Optional<U> {
        return invalidate(this.value)
            ? Optional.empty<U>()
            : Optional.ofNullable(mapper(this.value as T));
    }

    /**
     * Keeps the value only when it satisfies a predicate.
     * @param predicate - Test for a present value.
     * @example
     * const positive: Optional<number> = optional.filter((value) => value > 0);
     * @returns The same optional or an empty one.
     */
    public filter(predicate: (value: T) => boolean): Optional<T> {
        return invalidate(this.value) || !predicate(this.value as T)
            ? Optional.empty<T>()
            : this;
    }

    /**
     * Runs a callback for a present value.
     * @param action - Callback for a present value.
     * @example
     * optional.ifPresent((value) => console.log(value));
     */
    public ifPresent(action: (value: T) => void): void {
        if (validate(this.value)) {
            action(this.value as T);
        }
    }

    /**
     * Renders a diagnostic representation.
     * @example
     * const text: string = optional.toString();
     * @returns A debug string.
     */
    public toString(): string {
        return invalidate(this.value)
            ? "Optional.empty"
            : `Optional[${this.value as T}]`;
    }
}
