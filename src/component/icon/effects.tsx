import { createIcon, type Icon } from "./types";

/**
 * Shared motion effects for the larger icon groups.
 * Type: type alias.
 * Fields: none.
 * @example
 * const effect: IconEffect = "spin";
 */
export type IconEffect =
    | "spin"
    | "pulse"
    | "breathe"
    | "bounce"
    | "swing"
    | "wave"
    | "dash"
    | "bars"
    | "scan";

/**
 * Builds one line icon whose path carries a shared CSS motion effect.
 * @param name - Public icon name.
 * @param d - SVG path data.
 * @param effect - Shared effect class.
 * @example
 * const icon: Icon = createEffectIcon("MotionDashLine", "M3 12h18", "dash");
 * @returns An icon definition.
 */
export const createEffectIcon: (name: string, d: string, effect: IconEffect) => Icon = (
    name: string,
    d: string,
    effect: IconEffect,
): Icon => createIcon(name, <path className={`icon-fx-${effect}`} d={d} />);
