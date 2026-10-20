import type { ReactNode } from "react";
import List, { type ListProps } from "../List";

/**
 * List preset with fixed-row virtual windowing.
 * @example
 * <VirtualList items={items} itemHeight={48} height={320} />
 */
export const VirtualList: <Item>(props: Omit<ListProps<Item>, "virtual">) => ReactNode = <
    Item,
>(
    props: Omit<ListProps<Item>, "virtual">,
): ReactNode => <List {...props} virtual />;

export default VirtualList;
