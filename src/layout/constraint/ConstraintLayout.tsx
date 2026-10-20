import { type CSSProperties, type FC, type HTMLAttributes, type ReactNode, type Ref } from "react";
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
 * Fields: children, height, ariaLabel, ref, and native `div` attributes.
 * Native `id`, `className`, `style`, `title`, `tabIndex`, `role`, `aria-*`, `data-*`, pointer,
 * mouse, keyboard, and focus handlers are forwarded to the relative container.
 * @example
 * <ConstraintLayout height={240} aria-label="Canvas">...</ConstraintLayout>
 */
export interface ConstraintLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactNode;
    height?: number | string;
    ariaLabel?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Relative container whose children are positioned by anchors.
 * @param props - Height, children, and native attributes.
 * @example
 * <ConstraintLayout height={240}><Constraint horizontal="center" vertical="center">...</Constraint></ConstraintLayout>
 * @returns A constraint container.
 */
const ConstraintLayout: FC<ConstraintLayoutProps> = ({
    children,
    height = 240,
    className = "",
    style,
    role = "group",
    ariaLabel,
    ref,
    ...rest
}: ConstraintLayoutProps) => {
    const label: string | undefined = rest["aria-label"] ?? ariaLabel;

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("constraint-layout", className)}
            style={{ height, ...style }}
            role={role}
            aria-label={label}
        >
            {children}
        </div>
    );
};

/**
 * Props for one anchored constraint child.
 * Type: interface.
 * Fields: children, horizontal, vertical, offsetX, offsetY, width, height, zIndex, ref,
 * and native `div` attributes.
 * Caller `style` is merged after the computed anchors, so it can override them deliberately.
 * @example
 * <Constraint horizontal="end" vertical="top" offsetY={16}>Badge</Constraint>
 */
export interface ConstraintProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactNode;
    horizontal?: ConstraintHorizontal;
    vertical?: ConstraintVertical;
    offsetX?: number;
    offsetY?: number;
    width?: number | string;
    height?: number | string;
    zIndex?: number;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Positions a child against the container edges, centre, or both edges.
 * @param props - Anchors, offsets, optional size, and native attributes.
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
    style,
    ref,
    ...rest
}: ConstraintProps) => {
    const anchorStyle: CSSProperties = {
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
        <div {...rest} ref={ref} className={cx("constraint", className)} style={{ ...anchorStyle, ...style }}>
            {children}
        </div>
    );
};

export default ConstraintLayout;
