import type { ReactNode } from "react";
import Tree, { type TreeProps } from "../Tree";

/**
 * Tree preset with fixed-row virtualisation.
 * @example
 * <VirtualTree items={nodes} itemHeight={40} height={320} />
 */
export const VirtualTree: <Item>(props: Omit<TreeProps<Item>, "virtual">) => ReactNode = <Item,>(
    props: Omit<TreeProps<Item>, "virtual">,
): ReactNode => <Tree {...props} virtual />;

export default VirtualTree;
