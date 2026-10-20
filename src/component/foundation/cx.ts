/**
 * Value accepted by the className helper: a string or a falsy placeholder.
 * Type: type alias.
 * Fields: none.
 * @example
 * const value: ClassValue = isActive && "is-active";
 */
export type ClassValue = string | false | null | void;

/**
 * Joins class names, dropping falsy fragments.
 * @param values - Class name fragments; false, null, and (void 0) are ignored.
 * @example
 * const className = cx("chip", selected && "chip--selected");
 * @returns The joined class name.
 */
const cx: (...values: readonly ClassValue[]) => string = (
    ...values: readonly ClassValue[]
): string =>
    values
        .filter((value: ClassValue): value is string => typeof value === "string" && value.length > 0)
        .join(" ");

export default cx;
