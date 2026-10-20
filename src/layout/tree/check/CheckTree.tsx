import type { ReactNode } from "react";
import Tree, { type TreeProps } from "../Tree";

/**
 * Tree preset with checkbox selection.
 * @example
 * <CheckTree items={nodes} checkedKeys={checked} onCheckedChange={setChecked} />
 */
export const CheckTree: <Item>(props: Omit<TreeProps<Item>, "checkable">) => ReactNode = <Item,>(
    props: Omit<TreeProps<Item>, "checkable">,
): ReactNode => <Tree {...props} checkable />;

export default CheckTree;
