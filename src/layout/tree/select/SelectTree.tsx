import type { ReactNode } from "react";
import Tree, { type TreeProps } from "../Tree";

/**
 * Tree preset with single selection.
 * @example
 * <SelectTree items={nodes} selectedKeys={selected} onSelectionChange={setSelected} />
 */
export const SelectTree: <Item>(props: Omit<TreeProps<Item>, "selectionMode">) => ReactNode = <
    Item,
>(
    props: Omit<TreeProps<Item>, "selectionMode">,
): ReactNode => <Tree {...props} selectionMode="single" />;

export default SelectTree;
