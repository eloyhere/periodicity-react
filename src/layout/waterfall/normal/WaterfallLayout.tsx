import {
    Children,
    Fragment,
    type CSSProperties,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
import cx from "../../../component/foundation/cx";
import type { WaterfallItemState, WaterfallSlots } from "../slots";
import type { WaterfallGap } from "../types";
import "../WaterfallLayout.css";

export type { WaterfallGap } from "../types";

/**
 * Props for the flex-column masonry layout.
 * Type: interface.
 * Fields: children, columns, gap, responsive, slots, ariaLabel, ref, and native `div` attributes.
 * Native `id`, `className`, `style`, `title`, `tabIndex`, `role`, `aria-*`, `data-*`, pointer,
 * mouse, keyboard, and focus handlers are forwarded to the waterfall container.
 * @example
 * <WaterfallLayout columns={3} gap="md" aria-label="Highlights">...</WaterfallLayout>
 */
export interface WaterfallLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactNode;
    columns?: number;
    gap?: WaterfallGap;
    responsive?: boolean;
    /** Replaces the element that wraps each child; spread `state.className` and `state.style` to keep placement. */
    slots?: WaterfallSlots;
    ariaLabel?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Empty style shared by every flow-mode item container.
 * Type: constant.
 * Fields: none.
 * @example
 * const style = EmptyItemStyle;
 */
const EmptyItemStyle: CSSProperties = {};

/**
 * Distributes children across balanced masonry columns using flex, not CSS Grid.
 * @param props - Column count, gap, children, item-container slots, and native attributes.
 * @example
 * <WaterfallLayout columns={2}><Card /><Card /></WaterfallLayout>
 * @returns A waterfall layout.
 */
const WaterfallLayout: FC<WaterfallLayoutProps> = ({
    children,
    columns = 3,
    gap = "md",
    responsive = true,
    slots,
    className = "",
    style,
    ariaLabel,
    ref,
    ...rest
}: WaterfallLayoutProps) => {
    const safeColumns: number = Number.isFinite(columns) ? Math.max(1, Math.floor(columns)) : 1;
    const items: ReactNode[] = Children.toArray(children);
    const buckets: { child: ReactNode; index: number }[][] = Array.from(
        { length: safeColumns },
        (): { child: ReactNode; index: number }[] => [],
    );

    items.forEach((item: ReactNode, index: number): void => {
        buckets[index % safeColumns].push({ child: item, index });
    });

    const waterfallStyle: CSSProperties = {
        "--waterfall-columns": safeColumns,
    } as CSSProperties;
    const label: string | undefined = rest["aria-label"] ?? ariaLabel;

    return (
        <div
            {...rest}
            ref={ref}
            className={cx(
                "waterfall-layout",
                `waterfall-layout--gap-${gap}`,
                responsive && "waterfall-layout--responsive",
                className,
            )}
            style={{ ...waterfallStyle, ...style }}
            aria-label={label}
            data-columns={safeColumns}
        >
            {buckets.map(
                (
                    bucket: { child: ReactNode; index: number }[],
                    column: number,
                ): ReactNode => (
                    <div className="waterfall-layout__column" key={column}>
                        {bucket.map((entry: { child: ReactNode; index: number }): ReactNode => {
                            const state: WaterfallItemState = {
                                index: entry.index,
                                column,
                                top: 0,
                                className: "waterfall-layout__item",
                                style: EmptyItemStyle,
                            };
                            const slot: WaterfallSlots["item"] = slots?.item;
                            const content: ReactNode =
                                slot === (void 0) ? (
                                    <div className={state.className} style={state.style}>
                                        {entry.child}
                                    </div>
                                ) : (
                                    slot(entry.child, state)
                                );

                            return <Fragment key={entry.index}>{content}</Fragment>;
                        })}
                    </div>
                ),
            )}
        </div>
    );
};

export default WaterfallLayout;
