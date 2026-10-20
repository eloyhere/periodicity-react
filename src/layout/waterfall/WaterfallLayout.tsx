import { Children, type CSSProperties, type FC, type ReactNode } from "react";
import cx from "../../component/foundation/cx";
import "./WaterfallLayout.css";

/**
 * Gap steps for waterfall columns.
 * Type: type alias.
 * Fields: none.
 * @example
 * const gap: WaterfallGap = "md";
 */
export type WaterfallGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Props for the flex-column masonry layout.
 * Type: interface.
 * Fields: children, columns, gap, responsive, className, ariaLabel.
 * @example
 * <WaterfallLayout columns={3} gap="md">...</WaterfallLayout>
 */
export interface WaterfallLayoutProps {
    children: ReactNode;
    columns?: number;
    gap?: WaterfallGap;
    responsive?: boolean;
    className?: string;
    ariaLabel?: string;
}

/**
 * Distributes children across balanced masonry columns using flex, not CSS Grid.
 * @param props - Column count, gap, and children.
 * @example
 * <WaterfallLayout columns={2}><Card /><Card /></WaterfallLayout>
 * @returns A waterfall layout.
 */
const WaterfallLayout: FC<WaterfallLayoutProps> = ({
    children,
    columns = 3,
    gap = "md",
    responsive = true,
    className = "",
    ariaLabel,
}: WaterfallLayoutProps) => {
    const safeColumns: number = Math.max(1, Math.floor(columns));
    const items: ReactNode[] = Children.toArray(children);
    const buckets: ReactNode[][] = Array.from(
        { length: safeColumns },
        (): ReactNode[] => [],
    );

    items.forEach((item: ReactNode, index: number): void => {
        buckets[index % safeColumns].push(item);
    });

    const style: CSSProperties = {
        "--waterfall-columns": safeColumns,
    } as CSSProperties;

    return (
        <div
            className={cx(
                "waterfall-layout",
                `waterfall-layout--gap-${gap}`,
                responsive && "waterfall-layout--responsive",
                className,
            )}
            style={style}
            data-columns={safeColumns}
            aria-label={ariaLabel}
        >
            {buckets.map((bucket: ReactNode[], column: number): ReactNode => (
                <div className="waterfall-layout__column" key={column}>
                    {bucket.map((child: ReactNode, index: number): ReactNode => (
                        <div className="waterfall-layout__item" key={index}>
                            {child}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default WaterfallLayout;
