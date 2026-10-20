import { type CSSProperties, type FC, type HTMLAttributes, type ReactNode, type Ref } from "react";
import cx from "../../component/foundation/cx";
import "./LinearLayout.css";

/**
 * Direction of a linear layout.
 * Type: type alias.
 * Fields: none.
 * @example
 * const orientation: LinearOrientation = "vertical";
 */
export type LinearOrientation = "horizontal" | "vertical";

/**
 * Distribution of children along the main axis.
 * Type: type alias.
 * Fields: none.
 * @example
 * const gravity: LinearGravity = "between";
 */
export type LinearGravity = "start" | "center" | "end" | "between" | "around" | "evenly";

/**
 * Cross-axis alignment of children.
 * Type: type alias.
 * Fields: none.
 * @example
 * const align: LinearAlign = "center";
 */
export type LinearAlign = "start" | "center" | "end" | "stretch";

/**
 * Gap between linear children.
 * Type: type alias.
 * Fields: none.
 * @example
 * const gap: LinearGap = "md";
 */
export type LinearGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Props for the Android-style linear layout.
 * Type: interface.
 * Fields: children, orientation, gravity, align, gap, wrap, reverse, ariaLabel, ref,
 * and native `div` attributes.
 * Native `id`, `className`, `style`, `title`, `tabIndex`, `role`, `aria-*`, `data-*`, pointer,
 * mouse, keyboard, and focus handlers are forwarded to the linear container.
 * @example
 * <LinearLayout orientation="vertical" gap="md" aria-label="Actions">...</LinearLayout>
 */
export interface LinearLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactNode;
    orientation?: LinearOrientation;
    gravity?: LinearGravity;
    align?: LinearAlign;
    gap?: LinearGap;
    wrap?: boolean;
    reverse?: boolean;
    ariaLabel?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Flex row or column with Android LinearLayout gravity and gap semantics.
 * @param props - Direction, distribution, alignment, gap, and native attributes.
 * @example
 * <LinearLayout gravity="between" align="center">...</LinearLayout>
 * @returns A linear layout element.
 */
const LinearLayout: FC<LinearLayoutProps> = ({
    children,
    orientation = "vertical",
    gravity = "start",
    align = "stretch",
    gap = "none",
    wrap = false,
    reverse = false,
    className = "",
    ariaLabel,
    ref,
    ...rest
}: LinearLayoutProps) => {
    const label: string | undefined = rest["aria-label"] ?? ariaLabel;

    return (
        <div
            {...rest}
            ref={ref}
            className={cx(
                "linear",
                `linear--${orientation}`,
                `linear--gravity-${gravity}`,
                `linear--align-${align}`,
                `linear--gap-${gap}`,
                wrap && "linear--wrap",
                reverse && "linear--reverse",
                className,
            )}
            aria-label={label}
        >
            {children}
        </div>
    );
};

/**
 * Props for a weighted linear child.
 * Type: interface.
 * Fields: children, weight, alignSelf, ref, and native `div` attributes.
 * Caller `style` is merged after the computed weight, so it can override it deliberately.
 * @example
 * <LinearLayoutItem weight={2} aria-label="Weighted pane">...</LinearLayoutItem>
 */
export interface LinearLayoutItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactNode;
    weight?: number;
    alignSelf?: LinearAlign;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Child with Android layout_weight and per-child cross-axis alignment.
 * @param props - Weight, alignment, and native attributes.
 * @example
 * <LinearLayoutItem weight={1}>...</LinearLayoutItem>
 * @returns A weighted linear child.
 */
export const LinearLayoutItem: FC<LinearLayoutItemProps> = ({
    children,
    weight = 0,
    alignSelf,
    className = "",
    style,
    ref,
    ...rest
}: LinearLayoutItemProps) => {
    const weightStyle: CSSProperties = weight > 0 ? { flexGrow: weight, flexBasis: 0 } : {};

    return (
        <div
            {...rest}
            ref={ref}
            className={cx(
                "linear__item",
                alignSelf === (void 0) ? "" : `linear__item--align-${alignSelf}`,
                className,
            )}
            style={{ ...weightStyle, ...style }}
        >
            {children}
        </div>
    );
};

export default LinearLayout;
