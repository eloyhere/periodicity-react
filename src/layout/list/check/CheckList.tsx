import type { ReactNode } from "react";
import List, { type ListProps } from "../List";

/**
 * List preset with checkboxes and multi-selection.
 * @example
 * <CheckList items={items} selectedKeys={keys} onSelectionChange={setKeys} />
 */
export const CheckList: <Item>(props: Omit<ListProps<Item>, "selectionMode">) => ReactNode = <
    Item,
>(
    props: Omit<ListProps<Item>, "selectionMode">,
): ReactNode => <List {...props} selectionMode="multiple" />;

export default CheckList;
