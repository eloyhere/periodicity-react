import { Children, type CSSProperties, type FC, type ReactNode } from "react";
import cx from "../../component/foundation/cx";
import "./GridLayout.css";

/**
 * Gap steps for grid and waterfall layouts.
 * Type: type alias.
 * Fields: none.
 * @example
 * const gap: GridGap = "md";
 */
export type GridGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Props for the flex-based responsive grid.
 * Type: interface.
 * Fields: children, columns, gap, responsive, className, ariaLabel.
 * @example
 * <GridLayout columns={3} gap="md">...</GridLayout>
 */
export interface GridLayoutProps {
    children: ReactNode;
    columns?: number;
    gap?: GridGap;
    responsive?: boolean;
    className?: string;
    ariaLabel?: string;
}

/**
 * Flex grid with an explicit column count; never uses CSS Grid.
 * @param props - Column count, gap, and children.
 * @example
 * <GridLayout columns={2} gap="lg"><Card /><Card /></GridLayout>
 * @returns A responsive grid layout.
 */
const GridLayout: FC<GridLayoutProps> = ({
    children,
    columns = 3,
    gap = "md",
    responsive = true,
    className = "",
    ariaLabel,
}: GridLayoutProps) => {
    const safeColumns: number = Math.max(1, Math.floor(columns));
    const style: CSSProperties = {
        "--grid-columns": safeColumns,
    } as CSSProperties;

    return (
        <div
            className={cx(
                "grid-layout",
                `grid-layout--gap-${gap}`,
                responsive && "grid-layout--responsive",
                className,
            )}
            style={style}
            data-columns={safeColumns}
            aria-label={ariaLabel}
        >
            {Children.toArray(children).map((child: ReactNode, index: number): ReactNode => (
                <div className="grid-layout__cell" key={index}>
                    {child}
                </div>
            ))}
        </div>
    );
};

export default GridLayout;
