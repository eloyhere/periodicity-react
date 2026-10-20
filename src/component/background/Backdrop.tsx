import type { CSSProperties, FC, MouseEventHandler } from "react";
import cx from "../foundation/cx";
import "./Backdrop.css";

/**
 * Props for the overlay scrim.
 * Type: interface.
 * Fields: open, tone, blur, className, style, onClick.
 * @example
 * <Backdrop open onClick={close} />
 */
export interface BackdropProps {
    open?: boolean;
    tone?: "neutral" | "accent";
    blur?: boolean;
    className?: string;
    style?: CSSProperties;
    onClick?: MouseEventHandler<HTMLDivElement>;
}
/**
 * Renders a full-screen scrim behind drawers and command palettes.
 * @param props - Open state, tone, blur, style, and click handler.
 * @example
 * <Portal><Backdrop open={open} /></Portal>
 * @returns A backdrop element.
 */
const Backdrop: FC<BackdropProps> = ({
    open = false,
    tone = "neutral",
    blur = true,
    className = "",
    style,
    onClick,
}: BackdropProps) => (
    <div
        aria-hidden="true"
        className={cx("backdrop", `backdrop--${tone}`, blur && "backdrop--blur", className)}
        data-open={open ? "true" : "false"}
        style={style}
        onClick={onClick}
    />
);

export default Backdrop;
