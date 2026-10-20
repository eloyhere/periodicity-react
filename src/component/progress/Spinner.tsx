import type { FC, HTMLAttributes, Ref } from "react";
import cx from "../foundation/cx";
import VisuallyHidden from "../foundation/VisuallyHidden";
import "./Spinner.css";

/**
 * Size of a spinner.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: SpinnerSize = "lg";
 */
export type SpinnerSize = "sm" | "md" | "lg";

/**
 * Props for the Spinner component.
 * Type: interface.
 * Extends the native `span` attributes, so `id`, `title`, `aria-*`, `data-*`, `tabIndex`, and pointer,
 * mouse, keyboard, and focus handlers are forwarded to the live status element.
 * Fields: size, label, className.
 * @example
 * <Spinner size="lg" label="Loading rituals" />
 */
export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className"> {
    size?: SpinnerSize;
    label?: string;
    className?: string;
    ref?: Ref<HTMLSpanElement>;
}

/**
 * Renders an indeterminate SVG spinner in a live status region.
 * @param props - Size, screen-reader label, class name, and native span attributes.
 * @example
 * <Spinner label="Saving" />
 * @returns A spinner element.
 */
const Spinner: FC<SpinnerProps> = ({
    size = "md",
    label = "Loading",
    className = "",
    ref,
    ...rest
}: SpinnerProps) => (
    <span ref={ref} className={cx("spinner", `spinner--${size}`, className)} role="status" {...rest}>
        <svg className="spinner__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle className="spinner__track" cx={12} cy={12} r={9} />
            <circle className="spinner__arc" cx={12} cy={12} r={9} pathLength={100} strokeDasharray="56 44" />
        </svg>
        <VisuallyHidden>{label}</VisuallyHidden>
    </span>
);

export default Spinner;
