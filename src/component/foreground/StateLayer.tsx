import type { FC } from "react";
import cx from "../foundation/cx";
import "./StateLayer.css";

/**
 * Props for the Material state layer.
 * Type: interface.
 * Fields: className, active.
 * @example
 * <StateLayer active />
 */
export interface StateLayerProps {
    className?: string;
    active?: boolean;
}
/**
 * Paints the hover, press, and focus tint above a surface background.
 * @param props - Class name and an optional forced-active flag.
 * @example
 * <StateLayer />
 * @returns A decorative state layer.
 */
const StateLayer: FC<StateLayerProps> = ({ className = "", active = false }: StateLayerProps) => (
    <span aria-hidden="true" className={cx("state-layer", active && "state-layer--active", className)} />
);

export default StateLayer;
