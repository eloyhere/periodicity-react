import type { FC, HTMLAttributes, Ref } from "react";
import cx from "../foundation/cx";
import "./StateLayer.css";

/**
 * Props for the Material state layer.
 * Type: interface.
 * Fields: className, active, ref, plus native span attributes.
 * The layer is always hidden from assistive technology, so `aria-hidden` is not accepted.
 * @example
 * <StateLayer active />
 */
export interface StateLayerProps extends Omit<HTMLAttributes<HTMLSpanElement>, "aria-hidden" | "children"> {
    className?: string;
    active?: boolean;
    /** Ref for the native state layer element. */
    ref?: Ref<HTMLSpanElement>;
}

/**
 * Paints the hover, press, and focus tint above a surface background.
 * @param props - Class name, forced-active flag, and native span attributes.
 * @example
 * <StateLayer />
 * @returns A decorative state layer.
 */
const StateLayer: FC<StateLayerProps> = ({
    className = "",
    active = false,
    ref,
    ...rest
}: StateLayerProps) => (
    <span
        {...rest}
        ref={ref}
        aria-hidden="true"
        className={cx("state-layer", active && "state-layer--active", className)}
    />
);

export default StateLayer;
