import type { CSSProperties, ReactNode } from "react";

/**
 * Layout state handed to the item-container slot.
 * Type: interface.
 * Fields: index, column, top, height, className, style.
 * `top` is always 0 for the flow layout and is the absolute offset for the
 * virtual layout. `height` is only present when the layout fixes a card height.
 * @example
 * const state: WaterfallItemState = {
 *     index: 0,
 *     column: 0,
 *     top: 0,
 *     className: "waterfall-layout__item",
 *     style: {},
 * };
 */
export interface WaterfallItemState {
    readonly index: number;
    readonly column: number;
    readonly top: number;
    readonly height?: number;
    readonly className: string;
    readonly style: CSSProperties;
}

/**
 * Render slots for a waterfall layout.
 * Type: interface.
 * Fields: item.
 * The item slot replaces the element that wraps each child. Spread the
 * supplied `className` and `style` on the replacement container so the flex
 * columns and virtual placement keep working.
 * @example
 * <WaterfallLayout
 *     slots={{
 *         item: (child, state) => (
 *             <article className={state.className} style={state.style} data-column={state.column}>
 *                 {child}
 *             </article>
 *         ),
 *     }}
 * />
 */
export interface WaterfallSlots {
    item?: (children: ReactNode, state: WaterfallItemState) => ReactNode;
}
