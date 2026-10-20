import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    type CSSProperties,
    type AriaRole,
    type FC,
    type HTMLAttributes,
    type MutableRefObject,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import Backdrop from "../background/Backdrop";
import cx from "../foundation/cx";
import Portal from "../foundation/Portal";
import useAnchoredPosition, {
    type AnchoredPositionResult,
    type Placement,
} from "../foundation/useAnchoredPosition";
import useControllableState from "../foundation/useControllableState";
import useDismiss from "../foundation/useDismiss";
import useFocusTrap from "../foundation/useFocusTrap";
import useMergedRef from "../foundation/useMergedRef";
import Surface from "../surface/Surface";
import "./Popover.css";

/**
 * Why the popover asked to close.
 * Type: type alias.
 * Fields: none.
 * @example
 * const reason: PopoverCloseReason = "escape";
 */
export type PopoverCloseReason = "backdrop" | "escape" | "outside";

/**
 * Props for the anchored floating layer.
 * Type: interface.
 * @param open - Controlled open state; omit to let the popover manage its own state.
 * @param defaultOpen - Initial open state when uncontrolled; defaults to `false`.
 * @param onOpenChange - Called with the requested open state.
 * @param onClose - Called with the reason whenever the popover asks to close.
 * @param anchorRef - Element the floating layer is positioned against.
 * @param children - Interactive content rendered inside the popover surface.
 * @param placement - Preferred side and alignment; may flip to fit the viewport.
 * @param offset - Distance in pixels between anchor and floating layer.
 * @param matchWidth - Matches the floating width to the anchor width.
 * @param modal - Adds a backdrop and traps focus while open.
 * @param className - Extra class applied to the floating wrapper.
 * @param onDismiss - Called after a user dismissal request closes the popover.
 * @param ariaLabel - Accessible name used when the modal popover renders as a dialog.
 * @param closeOnEscape - Whether Escape asks the popover to close; defaults to `true`.
 * @param closeOnOutsidePress - Whether an outside press asks the popover to close; defaults to `true`.
 * @param restoreFocus - Whether focus returns to the anchor on close; defaults to `true` when modal.
 * @param ref - Ref for the native floating wrapper.
 * Native div attributes (id, style, aria-*, data-*, tabIndex, and events) are forwarded to the
 * floating wrapper.
 * @example
 * <Popover open={open} onOpenChange={setOpen} anchorRef={triggerRef} placement="bottom-start">
 *     <Menu>...</Menu>
 * </Popover>
 */
export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Called with the reason whenever the popover asks to close. */
    onClose?: (reason: PopoverCloseReason) => void;
    anchorRef: RefObject<HTMLElement | null>;
    children: ReactNode;
    placement?: Placement;
    offset?: number;
    matchWidth?: boolean;
    modal?: boolean;
    className?: string;
    onDismiss?: (reason: PopoverCloseReason) => void;
    ariaLabel?: string;
    closeOnEscape?: boolean;
    closeOnOutsidePress?: boolean;
    restoreFocus?: boolean;
    role?: AriaRole;
    /** Ref for the native floating wrapper. */
    ref?: Ref<HTMLDivElement>;
}

/**
 * Positions a Portal-rendered Surface against an anchor and dismisses it on outside press or Escape.
 * The `open` state may be controlled or uncontrolled, and `onClose` reports the reason
 * (`backdrop`, `escape`, or `outside`).
 * @param props - Open state, anchor ref, placement, modality, dismissal callbacks, and native wrapper attributes.
 * @example
 * <Popover open={open} onOpenChange={setOpen} anchorRef={buttonRef} modal>
 *     <p>Contextual content</p>
 * </Popover>
 * @returns A floating surface, or null while closed.
 */
const Popover: FC<PopoverProps> = ({
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onClose,
    anchorRef,
    children,
    placement = "bottom-start",
    offset = 8,
    matchWidth = false,
    modal = false,
    className = "",
    onDismiss,
    ariaLabel,
    closeOnEscape = true,
    closeOnOutsidePress = true,
    restoreFocus = true,
    role: roleProp,
    ref,
    style: styleProp,
    tabIndex = -1,
    "aria-label": ariaLabelAttribute,
    "aria-modal": ariaModalAttribute,
    ...rest
}: PopoverProps) => {
    const floatingRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const wasOpenRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const [open, setOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: openProp,
        defaultValue: defaultOpen,
        onChange: onOpenChange,
    });
    const { style, placement: resolvedPlacement, update }: AnchoredPositionResult =
        useAnchoredPosition(anchorRef, floatingRef, { placement, offset, matchWidth });
    const dismissRefs: readonly RefObject<HTMLElement | null>[] = [floatingRef, anchorRef];
    const mergedRef: RefCallback<HTMLDivElement> = useMergedRef<HTMLDivElement>(floatingRef, ref);

    const requestClose: (reason: PopoverCloseReason) => void = useCallback(
        (reason: PopoverCloseReason): void => {
            setOpen(false);
            onClose?.(reason);
            onDismiss?.(reason);
        },
        [onClose, onDismiss, setOpen],
    );

    useDismiss({
        enabled: open && !modal && closeOnOutsidePress,
        refs: dismissRefs,
        onDismiss: (): void => requestClose("outside"),
        escape: false,
    });
    useFocusTrap(floatingRef, open && modal, {
        onEscape: closeOnEscape ? (): void => requestClose("escape") : (void 0),
        returnFocus: false,
    });

    useEffect((): (() => void) | void => {
        if (!open || !closeOnEscape || modal) {
            return;
        }

        const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                requestClose("escape");
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return (): void => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [closeOnEscape, modal, open, requestClose]);

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
        if (wasOpenRef.current && !open && modal && restoreFocus) {
            anchorRef.current?.focus({ preventScroll: true });
        }

        wasOpenRef.current = open;
    }, [anchorRef, modal, open, restoreFocus]);

    if (!open) {
        return null;
    }

    const floatingStyle: CSSProperties = {
        ...style,
        zIndex: modal ? "var(--z-modal)" : "var(--z-dropdown)",
        ...styleProp,
    };
    const resolvedRole: AriaRole | void = roleProp ?? (modal ? "dialog" : (void 0));
    const resolvedLabel: string | void = modal
        ? (ariaLabelAttribute ?? ariaLabel ?? "Popover")
        : (ariaLabelAttribute ?? ariaLabel);
    return (
        <Portal>
            {modal ? (
                <Backdrop open className="popover__backdrop" onClick={(): void => requestClose("backdrop")} />
            ) : null}
            <div
                {...rest}
                ref={mergedRef}
                className={cx("popover", className)}
                style={floatingStyle}
                data-placement={resolvedPlacement}
                role={resolvedRole === (void 0) ? (void 0) : resolvedRole}
                aria-modal={modal ? true : ariaModalAttribute}
                aria-label={
                    resolvedLabel === (void 0) || resolvedLabel.length === 0 ? (void 0) : resolvedLabel
                }
                tabIndex={tabIndex}
            >
                <Surface className="popover__surface" elevation={3} shape="md">
                    {children}
                </Surface>
            </div>
        </Portal>
    );
};

export default Popover;
