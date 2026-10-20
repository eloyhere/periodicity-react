import type { FC, HTMLAttributes, ReactNode } from "react";
import "./layout.css";

export type Space = "xs" | "sm" | "md" | "lg" | "xl";
export type Align = "start" | "center" | "end" | "stretch";
export type Justify = "start" | "center" | "end" | "between";

interface StackProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    gap?: Space;
    align?: Align;
}

interface InlineProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    gap?: Space;
    align?: Align;
    justify?: Justify;
    wrap?: boolean;
}

interface ColumnsProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    gap?: Space;
    count?: 1 | 2 | 3 | 4;
}

export const Stack: FC<StackProps> = ({
    children,
    gap = "md",
    align = "stretch",
    className = "",
    ...rest
}: StackProps) => (
    <div className={`arrange-stack arrange-gap-${gap} arrange-align-${align} ${className}`.trim()} {...rest}>
        {children}
    </div>
);

export const Inline: FC<InlineProps> = ({
    children,
    gap = "sm",
    align = "center",
    justify = "start",
    wrap = false,
    className = "",
    ...rest
}: InlineProps) => (
    <div
        className={`arrange-inline arrange-gap-${gap} arrange-align-${align} arrange-justify-${justify} ${wrap ? "arrange-wrap" : ""} ${className}`.trim()}
        {...rest}
    >
        {children}
    </div>
);

export const Columns: FC<ColumnsProps> = ({
    children,
    gap = "md",
    count = 3,
    className = "",
    ...rest
}: ColumnsProps) => (
    <div className={`arrange-columns arrange-gap-${gap} arrange-columns-${count} ${className}`.trim()} {...rest}>
        {children}
    </div>
);
