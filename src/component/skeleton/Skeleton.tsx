import type { CSSProperties, FC, HTMLAttributes, ReactNode, Ref } from "react";
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
 * Extends the native `div` attributes, so `id`, `title`, `aria-*`, `data-*`, `tabIndex`, and pointer,
 * mouse, keyboard, and focus handlers are forwarded to the placeholder element. A caller supplied
 * `aria-hidden` takes precedence over the default `true`.
 * Fields: variant, width, height, lines, className.
 * @example
 * <Skeleton variant="text" lines={3} />
 */
export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    lines?: number;
    className?: string;
    ref?: Ref<HTMLDivElement>;
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
 * @param props - Variant, width, height, line count, class name, and native div attributes.
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
    style,
    ref,
    ...rest
}: SkeletonProps) => {
    const cssWidth: string = width === (void 0) ? "" : toCssSize(width);
    const cssHeight: string = height === (void 0) ? "" : toCssSize(height);
    const lineCount: number = variant === "text" ? Math.max(1, Math.trunc(lines)) : 1;
    const rootStyle: CSSProperties = {
        ...style,
        width: cssWidth.length > 0 ? cssWidth : style?.width,
        height: variant === "text" ? style?.height : cssHeight.length > 0 ? cssHeight : style?.height,
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
            <div
                ref={ref}
                className={cx("skeleton", "skeleton--text", className)}
                style={rootStyle}
                aria-hidden="true"
                {...rest}
            >
                {lineItems}
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className={cx("skeleton", `skeleton--${variant}`, className)}
            style={rootStyle}
            aria-hidden="true"
            {...rest}
        />
    );
};

export default Skeleton;
