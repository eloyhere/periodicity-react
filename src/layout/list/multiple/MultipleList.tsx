import type { ReactNode } from "react";
import List, { type ListProps } from "../List";

/**
 * List preset with toggleable multi-selection.
 * @example
 * <MultipleList items={items} selectedKeys={keys} onSelectionChange={setKeys} />
 */
export const MultipleList: <Item>(props: Omit<ListProps<Item>, "selectionMode">) => ReactNode = <
    Item,
>(
    props: Omit<ListProps<Item>, "selectionMode">,
): ReactNode => <List {...props} selectionMode="multiple" />;

export default MultipleList;
