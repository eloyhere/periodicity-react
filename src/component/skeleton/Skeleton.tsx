import type { CSSProperties, FC, ReactNode } from "react";
import cx from "../foundation/cx";
import "./Skeleton.css";

/**
 * Shape of a skeleton placeholder.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variant: SkeletonVariant = "circle";
 */
export type SkeletonVariant = "text" | "rect" | "circle";

/**
 * Props for the Skeleton component.
 * Type: interface.
 * Fields: variant, width, height, lines, className.
 * @example
 * <Skeleton variant="text" lines={3} />
 */
export interface SkeletonProps {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    lines?: number;
    className?: string;
}

/**
 * Converts a numeric size to pixels while passing CSS strings through unchanged.
 * @param value - Numeric pixels or a CSS length.
 * @example
 * const size = toCssSize(48);
 * @returns A CSS length string.
 */
const toCssSize: (value: string | number) => string = (value: string | number): string =>
    typeof value === "number" ? `${value}px` : value;

/**
 * Renders an aria-hidden loading placeholder for text, rectangles, or circles.
 * @param props - Variant, width, height, line count, and class name.
 * @example
 * <Skeleton variant="rect" height={180} />
 * @returns A skeleton placeholder element.
 */
const Skeleton: FC<SkeletonProps> = ({
    variant = "text",
    width,
    height,
    lines = 1,
    className = "",
}: SkeletonProps) => {
    const cssWidth: string = width === (void 0) ? "" : toCssSize(width);
    const cssHeight: string = height === (void 0) ? "" : toCssSize(height);
    const lineCount: number = variant === "text" ? Math.max(1, Math.trunc(lines)) : 1;
    const rootStyle: CSSProperties = {
        width: cssWidth.length > 0 ? cssWidth : (void 0),
        height: variant === "text" ? (void 0) : cssHeight.length > 0 ? cssHeight : (void 0),
    };
    const lineStyle: CSSProperties = { height: cssHeight.length > 0 ? cssHeight : (void 0) };
    const lineItems: ReactNode[] = [];

    for (let index: number = 0; index < lineCount; index += 1) {
        lineItems.push(
            <span
                key={index}
                className={cx("skeleton__line", index === lineCount - 1 && "skeleton__line--last")}
                style={lineStyle}
            />,
        );
    }

    if (variant === "text") {
        return (
            <div className={cx("skeleton", "skeleton--text", className)} style={rootStyle} aria-hidden="true">
                {lineItems}
            </div>
        );
    }

    return (
        <div
            className={cx("skeleton", `skeleton--${variant}`, className)}
            style={rootStyle}
            aria-hidden="true"
        />
    );
};

export default Skeleton;
