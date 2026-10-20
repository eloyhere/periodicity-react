import type { FC, HTMLAttributes, Ref } from "react";
import cx from "../foundation/cx";
import "./Backdrop.css";

/**
 * Props for the overlay scrim.
 * Type: interface.
 * Fields: open, tone, blur, className, style, onClick, ref, plus native div attributes.
 * The scrim is always hidden from assistive technology, so `aria-hidden` is not accepted.
 * @example
 * <Backdrop open onClick={close} />
 */
export interface BackdropProps extends Omit<HTMLAttributes<HTMLDivElement>, "aria-hidden" | "children"> {
    open?: boolean;
    tone?: "neutral" | "accent";
    blur?: boolean;
    /** Ref for the native backdrop element. */
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a full-screen scrim behind drawers and command palettes.
 * Caller handlers and native attributes are forwarded to the underlying div.
 * @param props - Open state, tone, blur, and native div attributes.
 * @example
 * <Portal><Backdrop open={open} /></Portal>
 * @returns A backdrop element.
 */
const Backdrop: FC<BackdropProps> = ({
    open = false,
    tone = "neutral",
    blur = true,
    className = "",
    ref,
    ...rest
}: BackdropProps) => (
    <div
        {...rest}
        ref={ref}
        aria-hidden="true"
        className={cx("backdrop", `backdrop--${tone}`, blur && "backdrop--blur", className)}
        data-open={open ? "true" : "false"}
    />
);

export default Backdrop;
