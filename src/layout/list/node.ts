import type { ReactNode } from "react";

/**
 * Standard list node.
 * Type: interface.
 * Fields: index, label, value.
 * @example
 * const option: ListOption<string> = { index: 0, label: "Morning pages", value: "morning" };
 */
export interface ListOption<Value = unknown> {
    index: number;
    label: ReactNode;
    value: Value;
}

/**
 * Standard tree node. `depth` is the visual depth; children remain optional so
 * callers can supply their own tree adapter.
 * Type: interface.
 * Fields: depth, index, label, value, children.
 * @example
 * const node: TreeOption<string> = { depth: 0, index: 0, label: "Book", value: "book" };
 */
export interface TreeOption<Value = unknown> extends ListOption<Value> {
    depth: number;
    children?: readonly TreeOption<Value>[];
}

/**
 * Checks whether a value is a standard list node.
 * @param value - Candidate node.
 * @example
 * const standard = isListOption({ index: 0, label: "A", value: "a" });
 * @returns True for list options.
 */
export const isListOption: (value: unknown) => value is ListOption<unknown> = (
    value: unknown,
): value is ListOption<unknown> =>
    typeof value === "object" &&
    value !== null &&
    "label" in value &&
    "value" in value &&
    "index" in value;

/**
 * Checks whether a value is a standard tree node.
 * @param value - Candidate node.
 * @example
 * const standard = isTreeOption({ depth: 0, index: 0, label: "A", value: "a" });
 * @returns True for tree options.
 */
export const isTreeOption: (value: unknown) => value is TreeOption<unknown> = (
    value: unknown,
): value is TreeOption<unknown> => isListOption(value) && "depth" in value;

/**
 * Resolves a node label, falling back to primitive text.
 * @param value - Node or primitive.
 * @example
 * const label = optionLabel({ index: 0, label: "A", value: "a" });
 * @returns A renderable label.
 */
export const optionLabel: (value: unknown) => ReactNode = (value: unknown): ReactNode =>
    isListOption(value) ? value.label : `${value}`;

/**
 * Resolves a stable node key from `value`, or the positional index.
 * @param value - Node or primitive.
 * @param index - Position in the list.
 * @example
 * const key = optionKey({ index: 0, label: "A", value: "a" }, 0);
 * @returns A stable key.
 */
export const optionKey: (value: unknown, index: number) => string = (
    value: unknown,
    index: number,
): string => (isListOption(value) ? `${value.value}` : `${index}`);
