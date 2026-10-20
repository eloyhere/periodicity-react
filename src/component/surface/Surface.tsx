import {
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type KeyboardEventHandler,
    type MouseEventHandler,
    type PointerEventHandler,
    type ReactNode,
    type Ref,
    type SetStateAction,
} from "react";
import {
    measureCenteredRipple,
    measureRipple,
    rippleColour,
    type RippleGeometry,
} from "../../animation/ripple";
import cx from "../foundation/cx";
import StateLayer from "../foreground/StateLayer";
import "../../animation/ripple/ripple.css";
import "./Surface.css";

/**
 * Layer on which the ripple is painted.
 * Type: type alias.
 * @example
 * const layer: RippleLayer = "foreground";
 */
export type RippleLayer = "background" | "foreground";

/**
 * Event that spawns a ripple.
 * Type: type alias.
 * @example
 * const trigger: RippleTrigger = "click";
 */
export type RippleTrigger = "hover" | "click" | "context";

/**
 * Ripple configuration.
 * Type: interface.
 * @param layer - Layer that paints the ripple; defaults to `foreground`.
 * @param trigger - Event or events that spawn the ripple; defaults to `click`.
 * @example
 * const ripple: RippleOptions = { layer: "foreground", trigger: ["hover", "click"] };
 */
export interface RippleOptions {
    layer?: RippleLayer;
    trigger?: RippleTrigger | readonly RippleTrigger[];
}

/**
 * Semantic tone of a Surface.
 * Type: type alias.
 * @example
 * const tone: SurfaceTone = "accent";
 */
export type SurfaceTone = "neutral" | "accent" | "mint" | "violet" | "amber" | "danger";

/**
 * Elevation level of a Surface.
 * Type: type alias.
 * @example
 * const elevation: SurfaceElevation = 1;
 */
export type SurfaceElevation = 0 | 1 | 2 | 3;

/**
 * Corner shape of a Surface.
 * Type: type alias.
 * @example
 * const shape: SurfaceShape = "md";
 */
export type SurfaceShape = "xs" | "sm" | "md" | "lg" | "pill";

interface RippleState {
    id: string;
    x: number;
    y: number;
    size: number;
    color: string;
}

interface RippleStyle extends CSSProperties {
    "--ripple-x": string;
    "--ripple-y": string;
    "--ripple-size": string;
    "--ripple-color": string;
}

/**
 * Props for the three-layer Surface container.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`, and any
 * mouse, pointer, keyboard, or focus handler are forwarded to the root element.
 * @param children - Content rendered in the component layer.
 * @param background - Decorative content painted below the component layer.
 * @param foreground - Decorative content painted above the component layer.
 * @param ripple - Ripple layer, options, or `false`.
 * @param tone - Semantic tone.
 * @param elevation - Elevation level.
 * @param shape - Corner shape.
 * @param stateLayer - Whether to render the hover/press state layer.
 * @param disabled - Disables the ripple and state layer.
 * @param ariaLabel - Convenience alias for `aria-label`; an explicit `aria-label` wins.
 * @param onPointerDown - Composed with the internal ripple listener and called afterwards.
 * @param onPointerEnter - Composed with the internal hover ripple listener and called afterwards.
 * @param onKeyDown - Composed with the internal keyboard ripple listener and called afterwards.
 * @param onContextMenu - Composed with the internal context ripple listener and called afterwards.
 * @example
 * <Surface ripple={{ layer: "foreground", trigger: "click" }} data-testid="panel">
 *     Save
 * </Surface>
 */
export interface SurfaceProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    background?: ReactNode;
    foreground?: ReactNode;
    ripple?: RippleLayer | RippleOptions | false;
    tone?: SurfaceTone;
    elevation?: SurfaceElevation;
    shape?: SurfaceShape;
    stateLayer?: boolean;
    disabled?: boolean;
    style?: CSSProperties;
    role?: string;
    tabIndex?: number;
    ariaLabel?: string;
    ref?: Ref<HTMLDivElement>;
    onPointerDown?: PointerEventHandler<HTMLDivElement>;
    onPointerEnter?: PointerEventHandler<HTMLDivElement>;
    onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
    onClick?: MouseEventHandler<HTMLDivElement>;
    onContextMenu?: MouseEventHandler<HTMLDivElement>;
}

/**
 * Default ripple behaviour: every Surface ripples on hover and click.
 * Type: constant.
 * Fields: layer, trigger.
 * @example
 * <Surface>Content</Surface>
 */
const DefaultRipple: RippleOptions = {
    layer: "foreground",
    trigger: ["hover", "click"],
};

// Native events already claimed by a nested Surface. This is a second guard in
// addition to stopPropagation, because React synthesises enter/leave events.
const ClaimedRippleEvents: WeakSet<Event> = new WeakSet<Event>();

/**
 * Renders background → component → foreground layers, with state layer and ripple support.
 * Type: function component.
 * @param props - Layer content, tone, elevation, shape, ripple options, native attributes, and handlers.
 * @example
 * <Surface ripple={{ trigger: "hover" }}>Hover me</Surface>
 * @returns A layered Surface element.
 */
const Surface: FC<SurfaceProps> = ({
    children,
    className = "",
    contentClassName = "",
    background,
    foreground,
    ripple = DefaultRipple,
    tone = "neutral",
    elevation = 0,
    shape,
    stateLayer = false,
    disabled = false,
    style,
    role,
    tabIndex,
    ariaLabel,
    ref,
    onPointerDown,
    onPointerEnter,
    onKeyDown,
    onClick,
    onContextMenu,
    ...rest
}: SurfaceProps) => {
    const [ripples, setRipples]: [RippleState[], Dispatch<SetStateAction<RippleState[]>>] =
        useState<RippleState[]>([]);

    const rippleEnabled: boolean = ripple !== false;
    const rippleLayer: RippleLayer =
        ripple === false
            ? "foreground"
            : typeof ripple === "string"
              ? ripple
              : (ripple.layer ?? "foreground");
    const rippleTriggers: readonly RippleTrigger[] =
        ripple === false
            ? []
            : typeof ripple === "string"
              ? ["click"]
              : typeof ripple.trigger === "string"
                ? [ripple.trigger]
                : (ripple.trigger ?? ["click"]);

    const shouldSpawn: (trigger: RippleTrigger) => boolean = (
        trigger: RippleTrigger,
    ): boolean => rippleEnabled && rippleTriggers.includes(trigger);

    const pushRipple: (geometry: RippleGeometry, element: HTMLDivElement) => void = (
        geometry: RippleGeometry,
        element: HTMLDivElement,
    ): void => {
        if (!rippleEnabled || disabled) {
            return;
        }

        const nextRipple: RippleState = {
            id: crypto.randomUUID(),
            x: geometry.x,
            y: geometry.y,
            size: geometry.size,
            color: rippleColour(element),
        };

        setRipples((current: RippleState[]): RippleState[] => [...current, nextRipple]);

        window.setTimeout((): void => {
            setRipples((current: RippleState[]): RippleState[] =>
                current.filter((item: RippleState): boolean => item.id !== nextRipple.id),
            );
        }, 1120);
    };

    const spawnRipple: (clientX: number, clientY: number, element: HTMLDivElement) => void = (
        clientX: number,
        clientY: number,
        element: HTMLDivElement,
    ): void => {
        pushRipple(measureRipple(element.getBoundingClientRect(), clientX, clientY), element);
    };

    const claimRipple: (event: { nativeEvent: Event }) => boolean = (event: {
        nativeEvent: Event;
    }): boolean => {
        if (ClaimedRippleEvents.has(event.nativeEvent)) {
            return false;
        }

        ClaimedRippleEvents.add(event.nativeEvent);
        return true;
    };

    const handlePointerDown: PointerEventHandler<HTMLDivElement> = (
        event: Parameters<PointerEventHandler<HTMLDivElement>>[0],
    ): void => {
        if (shouldSpawn("click")) {
            // A nested Surface must own the ripple; do not let the same pointer
            // press spawn a second effect on its ancestors.
            event.stopPropagation();

            if (claimRipple(event)) {
                spawnRipple(event.clientX, event.clientY, event.currentTarget);
            }
        }

        onPointerDown?.(event);
    };

    const handlePointerEnter: PointerEventHandler<HTMLDivElement> = (
        event: Parameters<PointerEventHandler<HTMLDivElement>>[0],
    ): void => {
        if (shouldSpawn("hover")) {
            // Keep hover effects local to the deepest Surface under the pointer.
            event.stopPropagation();

            if (claimRipple(event)) {
                spawnRipple(event.clientX, event.clientY, event.currentTarget);
            }
        }

        onPointerEnter?.(event);
    };

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: Parameters<KeyboardEventHandler<HTMLDivElement>>[0],
    ): void => {
        if (
            shouldSpawn("click") &&
            (event.key === "Enter" || event.key === " " || event.key === "Spacebar")
        ) {
            event.stopPropagation();

            if (claimRipple(event)) {
                pushRipple(
                    measureCenteredRipple(event.currentTarget.getBoundingClientRect()),
                    event.currentTarget,
                );
            }
        }

        onKeyDown?.(event);
    };

    const handleContextMenu: MouseEventHandler<HTMLDivElement> = (
        event: Parameters<MouseEventHandler<HTMLDivElement>>[0],
    ): void => {
        if (shouldSpawn("context")) {
            event.stopPropagation();

            if (claimRipple(event)) {
                spawnRipple(event.clientX, event.clientY, event.currentTarget);
            }
        }

        onContextMenu?.(event);
    };

    const rippleNodes: ReactNode = ripples.map((rippleItem: RippleState): ReactNode => {
        const rippleStyle: RippleStyle = {
            "--ripple-x": `${rippleItem.x}px`,
            "--ripple-y": `${rippleItem.y}px`,
            "--ripple-size": `${rippleItem.size}px`,
            "--ripple-color": rippleItem.color,
        };

        return <span key={rippleItem.id} className="ripple" style={rippleStyle} />;
    });

    return (
        <div
            ref={ref}
            style={style}
            role={role}
            tabIndex={tabIndex}
            aria-label={ariaLabel}
            className={cx(
                "surface",
                `surface--tone-${tone}`,
                elevation > 0 && `surface--elevation-${elevation}`,
                shape === (void 0) ? "" : `surface--shape-${shape}`,
                className,
            )}
            data-ripple={ripple === false ? "none" : rippleLayer}
            data-ripple-trigger={rippleTriggers.join(" ")}
            data-state-layer={stateLayer ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
            onPointerDown={handlePointerDown}
            onPointerEnter={handlePointerEnter}
            onKeyDown={handleKeyDown}
            onClick={onClick}
            onContextMenu={handleContextMenu}
            {...rest}
        >
            <div className="surface__background" aria-hidden="true">
                {background}
                {stateLayer ? <StateLayer /> : null}
                {rippleEnabled && rippleLayer === "background" ? rippleNodes : null}
            </div>
            <div className={cx("surface__component", contentClassName)}>{children}</div>
            <div className="surface__foreground" aria-hidden="true">
                {foreground}
                {rippleEnabled && rippleLayer === "foreground" ? rippleNodes : null}
            </div>
        </div>
    );
};

export default Surface;
