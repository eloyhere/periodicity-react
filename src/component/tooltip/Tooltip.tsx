import {
    cloneElement,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
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
    type SetStateAction,
} from "react";
import Portal from "../foundation/Portal";
import useAnchoredPosition, {
    type AnchoredPositionResult,
    type Placement,
} from "../foundation/useAnchoredPosition";
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
 * @param delay - Hover delay in milliseconds; focus shows immediately.
 * @param disabled - Suppresses the tooltip without changing the trigger.
 * @param arrow - Renders a small arrow pointing at the trigger.
 * @example
 * <Tooltip content="Keyboard shortcut">
 *     <Button>Open</Button>
 * </Tooltip>
 */
export interface TooltipProps {
    content: ReactNode;
    children: ReactElement;
    placement?: Placement;
    delay?: number;
    disabled?: boolean;
    arrow?: boolean;
}

/**
 * Shows a Portal-rendered description on hover or focus and hides it on leave, blur, or Escape.
 * @param props - Content, trigger, placement, delay, and disabled state.
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
    delay = 450,
    disabled = false,
    arrow = true,
}: TooltipProps) => {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const triggerRef: RefObject<HTMLElement | null> = useRef<HTMLElement>(null);
    const floatingRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const showTimerRef: MutableRefObject<number | null> = useRef<number | null>(null);
    const focusedRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const tooltipId: string = useId();
    const visible: boolean = open && !disabled;
    const { style, placement: resolvedPlacement, update }: AnchoredPositionResult = useAnchoredPosition(
        triggerRef,
        floatingRef,
        { placement, offset: 8 },
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

    const handlePointerEnter: PointerEventHandler<HTMLSpanElement> = (): void => {
        if (disabled) {
            return;
        }

        clearShowTimer();

        if (delay <= 0) {
            setOpen(true);
            return;
        }

        showTimerRef.current = window.setTimeout((): void => {
            showTimerRef.current = null;
            setOpen(true);
        }, delay);
    };

    const handlePointerLeave: PointerEventHandler<HTMLSpanElement> = (): void => {
        clearShowTimer();

        if (!focusedRef.current) {
            setOpen(false);
        }
    };

    const handleFocus: FocusEventHandler<HTMLSpanElement> = (): void => {
        if (disabled) {
            return;
        }

        focusedRef.current = true;
        clearShowTimer();
        setOpen(true);
    };

    const handleBlur: FocusEventHandler<HTMLSpanElement> = (): void => {
        focusedRef.current = false;
        clearShowTimer();
        setOpen(false);
    };

    useEffect((): (() => void) | void => {
        if (!visible) {
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
    }, [visible]);

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
            className="tooltip__trigger"
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
