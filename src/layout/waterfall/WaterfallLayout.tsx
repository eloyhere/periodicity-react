import {
    Children,
    type CSSProperties,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
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
 * Fields: children, columns, gap, responsive, ariaLabel, ref, and native `div` attributes.
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
    ariaLabel?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Distributes children across balanced masonry columns using flex, not CSS Grid.
 * @param props - Column count, gap, children, and native attributes.
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
    style,
    ariaLabel,
    ref,
    ...rest
}: WaterfallLayoutProps) => {
    const safeColumns: number = Math.max(1, Math.floor(columns));
    const items: ReactNode[] = Children.toArray(children);
    const buckets: ReactNode[][] = Array.from({ length: safeColumns }, (): ReactNode[] => []);

    items.forEach((item: ReactNode, index: number): void => {
        buckets[index % safeColumns].push(item);
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
