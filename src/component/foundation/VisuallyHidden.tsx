import type { FC, ReactNode } from "react";
import cx from "./cx";

/**
 * Props for visually hidden content that remains available to assistive technology.
 * Type: interface.
 * Fields: children, as, className.
 * @example
 * <VisuallyHidden>Open menu</VisuallyHidden>
 */
export interface VisuallyHiddenProps {
    children: ReactNode;
    as?: "span" | "div";
    className?: string;
}

/**
 * Hides content visually while keeping it readable by screen readers.
 * @param props - Content, element tag, and class name.
 * @example
 * <VisuallyHidden as="div">Screen-reader only</VisuallyHidden>
 * @returns A visually hidden element.
 */
const VisuallyHidden: FC<VisuallyHiddenProps> = ({ children, as = "span", className = "" }: VisuallyHiddenProps) => {
    const classes: string = cx("visually-hidden", className);

    if (as === "div") {
        return <div className={classes}>{children}</div>;
    }

    return <span className={classes}>{children}</span>;
};

export default VisuallyHidden;
