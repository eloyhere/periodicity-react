import {
    cloneElement,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    type CSSProperties,
    type FC,
    type FocusEventHandler,
    type HTMLAttributes,
    type MutableRefObject,
    type PointerEventHandler,
    type ReactElement,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import Portal from "../foundation/Portal";
import cx from "../foundation/cx";
import useAnchoredPosition, {
    type AnchoredPositionResult,
    type Placement,
} from "../foundation/useAnchoredPosition";
import useControllableState from "../foundation/useControllableState";
import useMergedRef from "../foundation/useMergedRef";
import Surface from "../surface/Surface";
import "./Tooltip.css";

/**
 * Trigger props that the tooltip augments.
 * Type: type alias.
 * Fields: ref, aria-describedby.
 * @param ref - Existing trigger ref, merged with the internal anchor ref.
 * @param aria-describedby - Existing description ids, merged with the tooltip id.
 * @example
 * const trigger: TooltipChildProps = { ref: buttonRef };
 */
type TooltipChildProps = { ref?: Ref<HTMLElement> } & Pick<HTMLAttributes<HTMLElement>, "aria-describedby">;

/**
 * Props for the delayed hover and focus tooltip.
 * Type: interface.
 * @param content - Tooltip body; keep it short and non-interactive.
 * @param children - Single trigger element that accepts a ref and ARIA attributes.
 * @param placement - Preferred side and alignment; may flip to fit the viewport.
 * @param offset - Distance in pixels between trigger and tooltip.
 * @param delay - Hover delay in milliseconds; focus shows immediately.
 * @param disabled - Suppresses the tooltip without changing the trigger.
 * @param arrow - Renders a small arrow pointing at the trigger.
 * @param open - Controlled visibility; omit to let hover and focus drive the tooltip.
 * @param defaultOpen - Initial visibility when uncontrolled; defaults to `false`.
 * @param onOpenChange - Called with the requested visibility.
 * @param closeOnEscape - Whether Escape hides a visible tooltip; defaults to `true`.
 * @param ref - Ref for the native trigger wrapper.
 * Native span attributes (id, style, aria-*, data-*, tabIndex, and events) are forwarded to the
 * trigger wrapper.
 * @example
 * <Tooltip content="Keyboard shortcut">
 *     <Button>Open</Button>
 * </Tooltip>
 */
export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "content"> {
    content: ReactNode;
    children: ReactElement;
    placement?: Placement;
    offset?: number;
    delay?: number;
    disabled?: boolean;
    arrow?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    closeOnEscape?: boolean;
    /** Ref for the native trigger wrapper. */
    ref?: Ref<HTMLSpanElement>;
}

/**
 * Shows a Portal-rendered description on hover or focus and hides it on leave, blur, or Escape.
 * @param props - Content, trigger, placement, delay, visibility, and disabled state.
 * @example
 * <Tooltip content="Duplicate the current card" placement="top">
 *     <Button icon="Plus" aria-label="Duplicate" />
 * </Tooltip>
 * @returns The trigger with a conditional tooltip surface.
 */
const Tooltip: FC<TooltipProps> = ({
    content,
    children,
    placement = "top",
    offset = 8,
    delay = 450,
    disabled = false,
    arrow = true,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    closeOnEscape = true,
    ref,
    className = "",
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    ...rest
}: TooltipProps) => {
    const [open, setOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: openProp,
        defaultValue: defaultOpen,
        onChange: onOpenChange,
    });
    const triggerRef: RefObject<HTMLElement | null> = useRef<HTMLElement>(null);
    const floatingRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const showTimerRef: MutableRefObject<number | null> = useRef<number | null>(null);
    const focusedRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const tooltipId: string = useId();
    const visible: boolean = open && !disabled;
    const { style, placement: resolvedPlacement, update }: AnchoredPositionResult = useAnchoredPosition(
        triggerRef,
        floatingRef,
        { placement, offset },
    );
    const child: ReactElement<TooltipChildProps> = children as ReactElement<TooltipChildProps>;
    const childProps: TooltipChildProps = child.props;
    const mergedTriggerRef: RefCallback<HTMLElement> = useMergedRef<HTMLElement>(triggerRef, childProps.ref);
    const describedBy: string = [visible ? tooltipId : "", childProps["aria-describedby"] ?? ""]
        .filter((value: string): boolean => value.length > 0)
        .join(" ");

    const clearShowTimer: () => void = useCallback((): void => {
        if (showTimerRef.current !== null) {
            window.clearTimeout(showTimerRef.current);
            showTimerRef.current = null;
        }
    }, []);

    const handlePointerEnter: PointerEventHandler<HTMLSpanElement> = (
        event: Parameters<PointerEventHandler<HTMLSpanElement>>[0],
    ): void => {
        if (!disabled) {
            clearShowTimer();

            if (delay <= 0) {
                setOpen(true);
            } else {
                showTimerRef.current = window.setTimeout((): void => {
                    showTimerRef.current = null;
                    setOpen(true);
                }, delay);
            }
        }

        onPointerEnter?.(event);
    };

    const handlePointerLeave: PointerEventHandler<HTMLSpanElement> = (
        event: Parameters<PointerEventHandler<HTMLSpanElement>>[0],
    ): void => {
        clearShowTimer();

        if (!focusedRef.current) {
            setOpen(false);
        }

        onPointerLeave?.(event);
    };

    const handleFocus: FocusEventHandler<HTMLSpanElement> = (
        event: Parameters<FocusEventHandler<HTMLSpanElement>>[0],
    ): void => {
        if (!disabled) {
            focusedRef.current = true;
            clearShowTimer();
            setOpen(true);
        }

        onFocus?.(event);
    };

    const handleBlur: FocusEventHandler<HTMLSpanElement> = (
        event: Parameters<FocusEventHandler<HTMLSpanElement>>[0],
    ): void => {
        focusedRef.current = false;
        clearShowTimer();
        setOpen(false);
        onBlur?.(event);
    };

    useEffect((): (() => void) | void => {
        if (!visible || !closeOnEscape) {
            return;
        }

        const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return (): void => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [closeOnEscape, setOpen, visible]);

    useLayoutEffect((): void => {
        if (visible) {
            update();
        }
    }, [visible, update]);

    useEffect((): (() => void) | void => {
        if (!visible) {
            return;
        }

        window.addEventListener("resize", update);

        return (): void => {
            window.removeEventListener("resize", update);
        };
    }, [visible, update]);

    useEffect((): (() => void) => (): void => {
        if (showTimerRef.current !== null) {
            window.clearTimeout(showTimerRef.current);
        }
    }, []);

    if (disabled) {
        return children;
    }

    const triggerProps: Partial<TooltipChildProps> = { ref: mergedTriggerRef };
    triggerProps["aria-describedby"] = describedBy.length > 0 ? describedBy : (void 0);

    const trigger: ReactElement = cloneElement(child, triggerProps);
    const tooltipStyle: CSSProperties = { ...style, zIndex: "var(--z-tooltip)" };

    return (
        <span
            {...rest}
            ref={ref}
            className={cx("tooltip__trigger", className)}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            {trigger}
            {visible ? (
                <Portal>
                    <div
                        ref={floatingRef}
                        id={tooltipId}
                        className="tooltip"
                        style={tooltipStyle}
                        data-placement={resolvedPlacement}
                        role="tooltip"
                    >
                        <Surface className="tooltip__bubble" elevation={2} shape="sm">
                            <div className="tooltip__content">{content}</div>
                        </Surface>
                        {arrow ? <span className="tooltip__arrow" aria-hidden="true" /> : null}
                    </div>
                </Portal>
            ) : null}
        </span>
    );
};

export default Tooltip;
