import type { ListAdapter } from "../../../../layout/list/adapter";
import { createListAdapter } from "../../../../layout/list/adapter";
import type { IconName } from "../../../icon/Icon";

/**
 * One choice offered by the select components.
 * Type: interface.
 * Fields: value, label, disabled, icon.
 * @example
 * const option: SelectOption = { value: "daily", label: "Daily" };
 */
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    icon?: IconName;
}

/**
 * Indexed adapter used by normal and virtual Select variants.
 * Type: type alias.
 * Fields: none.
 * @example
 * const adapter: SelectAdapter = createSelectAdapter(options);
 */
export type SelectAdapter = ListAdapter<SelectOption>;

/**
 * Builds the adapter expected by the select controls.
 * @param options - Choices in display order.
 * @example
 * const adapter = createSelectAdapter([
 *     { value: "daily", label: "Daily" },
 * ]);
 * @returns An indexed select adapter.
 */
export const createSelectAdapter: (options: readonly SelectOption[]) => SelectAdapter = (
    options: readonly SelectOption[],
): SelectAdapter =>
    createListAdapter<SelectOption>(options, {
        getKey: (option: SelectOption): string => option.value,
    });
