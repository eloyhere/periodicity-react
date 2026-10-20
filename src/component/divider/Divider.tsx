import type { FC, ReactNode } from "react";
import cx from "../foundation/cx";
import "./Divider.css";

/**
 * Orientation of a divider.
 * Type: type alias.
 * Fields: none.
 * @example
 * const orientation: DividerOrientation = "vertical";
 */
export type DividerOrientation = "horizontal" | "vertical";

/**
 * Inset applied to the start edge of a divider.
 * Type: type alias.
 * Fields: none.
 * @example
 * const inset: DividerInset = "both";
 */
export type DividerInset = "none" | "start" | "both";

/**
 * Props for the Divider component.
 * Type: interface.
 * Fields: orientation, inset, label, className.
 * @example
 * <Divider label="or" inset="both" />
 */
export interface DividerProps {
    orientation?: DividerOrientation;
    inset?: DividerInset;
    label?: ReactNode;
    className?: string;
}

/**
 * Renders a separator with optional inset and an inline label between two rules.
 * @param props - Orientation, inset, optional label, and class name.
 * @example
 * <Divider label="or" />
 * @returns A horizontal or vertical separator element.
 */
const Divider: FC<DividerProps> = ({
    orientation = "horizontal",
    inset = "none",
    label,
    className = "",
}: DividerProps) => {
    const hasLabel: boolean = label !== (void 0) && label !== null;

    return (
        <div
            className={cx(
                "divider",
                `divider--${orientation}`,
                inset !== "none" && `divider--inset-${inset}`,
                className,
            )}
            role="separator"
            aria-orientation={orientation}
            aria-label={typeof label === "string" ? label : (void 0)}
        >
            <span className="divider__line" aria-hidden="true" />
            {hasLabel ? <span className="divider__label">{label}</span> : null}
            {hasLabel ? <span className="divider__line" aria-hidden="true" /> : null}
        </div>
    );
};

export default Divider;
