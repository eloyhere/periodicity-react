import { type CSSProperties, type FC, type ReactNode } from "react";
import cx from "../../component/foundation/cx";
import "./ConstraintLayout.css";

/**
 * Horizontal anchor of a constraint child.
 * Type: type alias.
 * Fields: none.
 * @example
 * const horizontal: ConstraintHorizontal = "center";
 */
export type ConstraintHorizontal = "start" | "center" | "end" | "stretch";

/**
 * Vertical anchor of a constraint child.
 * Type: type alias.
 * Fields: none.
 * @example
 * const vertical: ConstraintVertical = "bottom";
 */
export type ConstraintVertical = "top" | "center" | "bottom" | "stretch";

/**
 * Props for a relative constraint container.
 * Type: interface.
 * Fields: children, height, className, ariaLabel.
 * @example
 * <ConstraintLayout height={280}>...</ConstraintLayout>
 */
export interface ConstraintLayoutProps {
    children: ReactNode;
    height?: number | string;
    className?: string;
    ariaLabel?: string;
}

/**
 * Relative container whose children are positioned by anchors.
 * @param props - Height and children.
 * @example
 * <ConstraintLayout height={240}><Constraint horizontal="center" vertical="center">...</Constraint></ConstraintLayout>
 * @returns A constraint container.
 */
const ConstraintLayout: FC<ConstraintLayoutProps> = ({
    children,
    height = 240,
    className = "",
    ariaLabel,
}: ConstraintLayoutProps) => (
    <div
        className={cx("constraint-layout", className)}
        style={{ height }}
        role="group"
        aria-label={ariaLabel}
    >
        {children}
    </div>
);

/**
 * Props for one anchored constraint child.
 * Type: interface.
 * Fields: children, horizontal, vertical, offsetX, offsetY, width, height, zIndex, className.
 * @example
 * <Constraint horizontal="end" vertical="top" offsetY={16}>Badge</Constraint>
 */
export interface ConstraintProps {
    children: ReactNode;
    horizontal?: ConstraintHorizontal;
    vertical?: ConstraintVertical;
    offsetX?: number;
    offsetY?: number;
    width?: number | string;
    height?: number | string;
    zIndex?: number;
    className?: string;
}

/**
 * Positions a child against the container edges, centre, or both edges.
 * @param props - Anchors, offsets, and optional size.
 * @example
 * <Constraint horizontal="center" vertical="center">Centre</Constraint>
 * @returns An absolutely positioned constraint child.
 */
export const Constraint: FC<ConstraintProps> = ({
    children,
    horizontal = "stretch",
    vertical = "stretch",
    offsetX = 0,
    offsetY = 0,
    width,
    height,
    zIndex = 0,
    className = "",
}: ConstraintProps) => {
    const style: CSSProperties = {
        left:
            horizontal === "end"
                ? "auto"
                : horizontal === "center"
                  ? `calc(50% + ${offsetX}px)`
                  : `${offsetX}px`,
        right: horizontal === "end" ? `${offsetX}px` : horizontal === "stretch" ? "0" : "auto",
        top:
            vertical === "bottom"
                ? "auto"
                : vertical === "center"
                  ? `calc(50% + ${offsetY}px)`
                  : `${offsetY}px`,
        bottom: vertical === "bottom" ? `${offsetY}px` : vertical === "stretch" ? "0" : "auto",
        width,
        height,
        zIndex,
        transform:
            horizontal === "center" && vertical === "center"
                ? "translate(-50%, -50%)"
                : horizontal === "center"
                  ? "translateX(-50%)"
                  : vertical === "center"
                    ? "translateY(-50%)"
                    : (void 0),
    };

    return (
        <div className={cx("constraint", className)} style={style}>
            {children}
        </div>
    );
};

export default ConstraintLayout;
