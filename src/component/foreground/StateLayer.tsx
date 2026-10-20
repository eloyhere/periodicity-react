import {
    useEffect,
    useRef,
    type FC,
    type HTMLAttributes,
    type Ref,
    type RefObject,
} from "react";
import cx from "../foundation/cx";
import useMergedRef from "../foundation/useMergedRef";
import { paintRipple } from "../foundation/useRipple";
import "./StateLayer.css";

/**
 * Props for the Material state layer.
 * Type: interface.
 * Fields: className, active, disabled, ref, plus native span attributes.
 * The layer is always hidden from assistive technology, so `aria-hidden` is not accepted.
 * @example
 * <StateLayer active />
 */
export interface StateLayerProps extends Omit<HTMLAttributes<HTMLSpanElement>, "aria-hidden" | "children"> {
    className?: string;
    active?: boolean;
    disabled?: boolean;
    /** Ref for the native state layer element. */
    ref?: Ref<HTMLSpanElement>;
}

/**
 * Paints the hover, press, and focus tint above a surface background and, when
 * it owns its interaction area, forwards pointer ripples from that parent.
 * @param props - Class name, forced-active flag, disabled state, and native span attributes.
 * @example
 * <StateLayer />
 * @returns A decorative state layer.
 */
const StateLayer: FC<StateLayerProps> = ({
    className = "",
    active = false,
    disabled = false,
    ref,
    ...rest
}: StateLayerProps) => {
    const rootRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
    const mergedRef: Ref<HTMLSpanElement> = useMergedRef<HTMLSpanElement>(ref, rootRef);

    useEffect((): (() => void) | void => {
        const host: HTMLSpanElement | null = rootRef.current;
        const parent: HTMLElement | null = host?.parentElement ?? null;

        if (disabled || host === null || parent === null) {
            return;
        }

        // A Surface already owns its ripple; avoid two overlapping layers.
        if (parent.closest(".surface") !== null) {
            return;
        }

        const pointerDown: (event: PointerEvent) => void = (event: PointerEvent): void => {
            if (event.button === 0) {
                paintRipple(host, event.clientX, event.clientY);
            }
        };
        const pointerEnter: (event: PointerEvent) => void = (event: PointerEvent): void => {
            paintRipple(host, event.clientX, event.clientY);
        };

        parent.addEventListener("pointerdown", pointerDown);
        parent.addEventListener("pointerenter", pointerEnter);

        return (): void => {
            parent.removeEventListener("pointerdown", pointerDown);
            parent.removeEventListener("pointerenter", pointerEnter);
        };
    }, [disabled]);

    return (
        <span
            {...rest}
            ref={mergedRef}
            aria-hidden="true"
            className={cx(
                "state-layer",
                active && "state-layer--active",
                disabled && "state-layer--disabled",
                className,
            )}
            data-disabled={disabled ? "true" : "false"}
        />
    );
};

export default StateLayer;
