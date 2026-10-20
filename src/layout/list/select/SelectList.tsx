import type { ReactNode } from "react";
import List, { type ListProps } from "../List";

/**
 * List preset with one active row.
 * @example
 * <SelectList items={items} selectedKeys={keys} onSelectionChange={setKeys} />
 */
export const SelectList: <Item>(props: Omit<ListProps<Item>, "selectionMode">) => ReactNode = <
    Item,
>(
    props: Omit<ListProps<Item>, "selectionMode">,
): ReactNode => <List {...props} selectionMode="single" />;

export default SelectList;
