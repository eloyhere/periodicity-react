import {
    Children,
    type CSSProperties,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
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
 * Fields: children, columns, gap, responsive, ariaLabel, ref, and native `div` attributes.
 * Native `id`, `className`, `style`, `title`, `tabIndex`, `role`, `aria-*`, `data-*`, pointer,
 * mouse, keyboard, and focus handlers are forwarded to the grid container.
 * @example
 * <GridLayout columns={3} gap="md" aria-label="Gallery">...</GridLayout>
 */
export interface GridLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactNode;
    columns?: number;
    gap?: GridGap;
    responsive?: boolean;
    ariaLabel?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Flex grid with an explicit column count; never uses CSS Grid.
 * @param props - Column count, gap, children, and native attributes.
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
    style,
    ariaLabel,
    ref,
    ...rest
}: GridLayoutProps) => {
    const safeColumns: number = Math.max(1, Math.floor(columns));
    const gridStyle: CSSProperties = {
        "--grid-columns": safeColumns,
    } as CSSProperties;
    const label: string | undefined = rest["aria-label"] ?? ariaLabel;

    return (
        <div
            {...rest}
            ref={ref}
            className={cx(
                "grid-layout",
                `grid-layout--gap-${gap}`,
                responsive && "grid-layout--responsive",
                className,
            )}
            style={{ ...gridStyle, ...style }}
            aria-label={label}
            data-columns={safeColumns}
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
