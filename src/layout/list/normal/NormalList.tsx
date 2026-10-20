import type { ReactNode } from "react";
import List, { type ListProps } from "../List";

/**
 * List preset without selection.
 * Type: function component.
 * @example
 * <NormalList items={items} />
 */
export const NormalList: <Item>(props: Omit<ListProps<Item>, "selectionMode">) => ReactNode = <
    Item,
>(
    props: Omit<ListProps<Item>, "selectionMode">,
): ReactNode => <List {...props} selectionMode="none" />;

export default NormalList;
