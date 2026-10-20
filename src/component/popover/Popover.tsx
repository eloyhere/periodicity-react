import {
    useEffect,
    useLayoutEffect,
    useRef,
    type CSSProperties,
    type FC,
    type MutableRefObject,
    type ReactNode,
    type RefObject,
} from "react";
import Backdrop from "../background/Backdrop";
import cx from "../foundation/cx";
import Portal from "../foundation/Portal";
import useAnchoredPosition, {
    type AnchoredPositionResult,
    type Placement,
} from "../foundation/useAnchoredPosition";
import useDismiss from "../foundation/useDismiss";
import useFocusTrap from "../foundation/useFocusTrap";
import Surface from "../surface/Surface";
import "./Popover.css";

/**
 * Props for the anchored floating layer.
 * Type: interface.
 * @param open - Whether the popover is visible.
 * @param onOpenChange - Called with the requested open state.
 * @param anchorRef - Element the floating layer is positioned against.
 * @param children - Interactive content rendered inside the popover surface.
 * @param placement - Preferred side and alignment; may flip to fit the viewport.
 * @param offset - Distance in pixels between anchor and floating layer.
 * @param matchWidth - Matches the floating width to the anchor width.
 * @param modal - Adds a backdrop and traps focus while open.
 * @param className - Extra class applied to the floating wrapper.
 * @param onDismiss - Called after a user dismissal request closes the popover.
 * @param ariaLabel - Accessible name used when the modal popover renders as a dialog.
 * @example
 * <Popover open={open} onOpenChange={setOpen} anchorRef={triggerRef} placement="bottom-start">
 *     <Menu>...</Menu>
 * </Popover>
 */
export interface PopoverProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    anchorRef: RefObject<HTMLElement | null>;
    children: ReactNode;
    placement?: Placement;
    offset?: number;
    matchWidth?: boolean;
    modal?: boolean;
    className?: string;
    onDismiss?: () => void;
    ariaLabel?: string;
}

/**
 * Positions a Portal-rendered Surface against an anchor and dismisses it on outside press or Escape.
 * @param props - Open state, anchor ref, placement, modality, and dismissal callbacks.
 * @example
 * <Popover open={open} onOpenChange={setOpen} anchorRef={buttonRef} modal>
 *     <p>Contextual content</p>
 * </Popover>
 * @returns A floating surface, or null while closed.
 */
const Popover: FC<PopoverProps> = ({
    open,
    onOpenChange,
    anchorRef,
    children,
    placement = "bottom-start",
    offset = 8,
    matchWidth = false,
    modal = false,
    className = "",
    onDismiss,
    ariaLabel,
}: PopoverProps) => {
    const floatingRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const wasOpenRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const { style, placement: resolvedPlacement, update }: AnchoredPositionResult =
        useAnchoredPosition(anchorRef, floatingRef, { placement, offset, matchWidth });
    const dismissRefs: readonly RefObject<HTMLElement | null>[] = [floatingRef, anchorRef];

    const handleDismiss: () => void = (): void => {
        onOpenChange(false);
        onDismiss?.();
    };

    useDismiss({ enabled: open && !modal, refs: dismissRefs, onDismiss: handleDismiss });
    useFocusTrap(floatingRef, open && modal, { onEscape: handleDismiss, returnFocus: false });

    useLayoutEffect((): void => {
        if (open) {
            update();
        }
    }, [open, update]);

    useEffect((): (() => void) | void => {
        if (!open) {
            return;
        }

        window.addEventListener("resize", update);

        return (): void => {
            window.removeEventListener("resize", update);
        };
    }, [open, update]);

    useEffect((): void => {
        if (wasOpenRef.current && !open && modal) {
            anchorRef.current?.focus({ preventScroll: true });
        }

        wasOpenRef.current = open;
    }, [anchorRef, modal, open]);

    if (!open) {
        return null;
    }

    const floatingStyle: CSSProperties = {
        ...style,
        zIndex: modal ? "var(--z-modal)" : "var(--z-dropdown)",
    };
    return (
        <Portal>
            {modal ? <Backdrop open className="popover__backdrop" onClick={handleDismiss} /> : null}
            <div
                ref={floatingRef}
                className={cx("popover", className)}
                style={floatingStyle}
                data-placement={resolvedPlacement}
                role={modal ? "dialog" : (void 0)}
                aria-modal={modal ? true : (void 0)}
                aria-label={modal ? (ariaLabel ?? "Popover") : (void 0)}
                tabIndex={-1}
            >
                <Surface className="popover__surface" elevation={3} shape="md">
                    {children}
                </Surface>
            </div>
        </Portal>
    );
};

export default Popover;
