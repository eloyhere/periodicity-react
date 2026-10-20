import type { FC, HTMLAttributes, ReactNode, Ref } from "react";
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
 * Extends the native `div` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`, and
 * pointer, mouse, keyboard, and focus handlers are forwarded to the separator element. A caller supplied
 * `aria-label` or `aria-hidden` takes precedence over the label-derived defaults.
 * Fields: orientation, inset, label, className.
 * @example
 * <Divider label="or" inset="both" />
 */
export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
    orientation?: DividerOrientation;
    inset?: DividerInset;
    label?: ReactNode;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a separator with optional inset and an inline label between two rules.
 * @param props - Orientation, inset, optional label, class name, and native div attributes.
 * @example
 * <Divider label="or" />
 * @returns A horizontal or vertical separator element.
 */
const Divider: FC<DividerProps> = ({
    orientation = "horizontal",
    inset = "none",
    label,
    className = "",
    ref,
    ...rest
}: DividerProps) => {
    const hasLabel: boolean = label !== (void 0) && label !== null;

    return (
        <div
            ref={ref}
            className={cx(
                "divider",
                `divider--${orientation}`,
                inset !== "none" && `divider--inset-${inset}`,
                className,
            )}
            role="separator"
            aria-orientation={orientation}
            aria-label={typeof label === "string" ? label : (void 0)}
            {...rest}
        >
            <span className="divider__line" aria-hidden="true" />
            {hasLabel ? <span className="divider__label">{label}</span> : null}
            {hasLabel ? <span className="divider__line" aria-hidden="true" /> : null}
        </div>
    );
};

export default Divider;
