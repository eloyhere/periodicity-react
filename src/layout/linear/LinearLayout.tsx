import { type CSSProperties, type FC, type ReactNode } from "react";
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
 * Fields: children, orientation, gravity, align, gap, wrap, reverse, className, ariaLabel.
 * @example
 * <LinearLayout orientation="vertical" gap="md">...</LinearLayout>
 */
export interface LinearLayoutProps {
    children: ReactNode;
    orientation?: LinearOrientation;
    gravity?: LinearGravity;
    align?: LinearAlign;
    gap?: LinearGap;
    wrap?: boolean;
    reverse?: boolean;
    className?: string;
    ariaLabel?: string;
}

/**
 * Flex row or column with Android LinearLayout gravity and gap semantics.
 * @param props - Direction, distribution, alignment, and gap.
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
}: LinearLayoutProps) => (
    <div
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
        aria-label={ariaLabel}
    >
        {children}
    </div>
);

/**
 * Props for a weighted linear child.
 * Type: interface.
 * Fields: children, weight, alignSelf, className.
 * @example
 * <LinearLayoutItem weight={2}>...</LinearLayoutItem>
 */
export interface LinearLayoutItemProps {
    children: ReactNode;
    weight?: number;
    alignSelf?: LinearAlign;
    className?: string;
}

/**
 * Child with Android layout_weight and per-child cross-axis alignment.
 * @param props - Weight and alignment.
 * @example
 * <LinearLayoutItem weight={1}>...</LinearLayoutItem>
 * @returns A weighted linear child.
 */
export const LinearLayoutItem: FC<LinearLayoutItemProps> = ({
    children,
    weight = 0,
    alignSelf,
    className = "",
}: LinearLayoutItemProps) => {
    const style: CSSProperties = weight > 0 ? { flexGrow: weight, flexBasis: 0 } : {};

    return (
        <div
            className={cx(
                "linear__item",
                alignSelf === (void 0) ? "" : `linear__item--align-${alignSelf}`,
                className,
            )}
            style={style}
        >
            {children}
        </div>
    );
};

export default LinearLayout;
