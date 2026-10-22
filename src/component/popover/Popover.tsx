import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    type CSSProperties,
    type AriaRole,
    type FC,
    type FocusEvent as ReactFocusEvent,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
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
export type PopoverCloseReason = "backdrop" | "escape" | "outside" | "tab";

/**
 * Snapshot of the ARIA attributes the popover owns on an external anchor.
 * Type: interface.
 * Fields: expanded, controls.
 * @example
 * const snapshot: AnchorAriaSnapshot = { expanded: null, controls: null };
 */
interface AnchorAriaSnapshot {
    expanded: string | null;
    controls: string | null;
}

const FocusableSelector: string = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "summary",
    "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

const TriggerSelector: string = [
    "button",
    "[role='button']",
    "a[href]",
    "summary",
    "select",
    "[role='combobox']",
    "[role='menuitem']",
    "[role='tab']",
].join(",");

/**
 * Reports whether an element can receive focus and is visibly rendered.
 * @param node - Candidate focus target.
 * @example
 * const usable = isVisibleFocusable(button);
 * @returns Whether the element belongs in the Tab sequence.
 */
const isVisibleFocusable: (node: HTMLElement) => boolean = (node: HTMLElement): boolean =>
    node.getClientRects().length > 0 &&
    !node.hasAttribute("inert") &&
    node.closest("[inert]") === null &&
    !(node instanceof HTMLInputElement && node.type === "hidden");

/**
 * Collects the visible focusable descendants of a floating layer.
 * @param container - Floating layer element.
 * @example
 * const items = getFocusableItems(popover);
 * @returns Focusable elements in document order.
 */
const getFocusableItems: (container: HTMLElement) => HTMLElement[] = (
    container: HTMLElement,
): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FocusableSelector)).filter(
        (node: HTMLElement): boolean => isVisibleFocusable(node),
    );

/**
 * Focuses an anchor directly, or the first focusable element inside a wrapper anchor.
 * @param anchor - Element held by `anchorRef`.
 * @example
 * focusAnchor(triggerRef.current);
 * @returns Nothing.
 */
const focusAnchor: (anchor: HTMLElement | null) => void = (anchor: HTMLElement | null): void => {
    if (anchor === null) {
        return;
    }

    if (anchor.tabIndex >= 0 || anchor.isContentEditable) {
        anchor.focus({ preventScroll: true });
        return;
    }

    const target: HTMLElement | void = getFocusableItems(anchor)[0];

    if (target !== (void 0)) {
        target.focus({ preventScroll: true });
        return;
    }

    anchor.focus({ preventScroll: true });
};

/**
 * Reports whether an anchor natively supports the disclosure ARIA attributes.
 * @param anchor - Element held by `anchorRef`.
 * @example
 * const supported = isTriggerLike(button);
 * @returns Whether the popover may mirror `aria-expanded` and `aria-controls` onto it.
 */
const isTriggerLike: (anchor: HTMLElement) => boolean = (anchor: HTMLElement): boolean =>
    anchor.matches(TriggerSelector);

/**
 * Resolves the element that should carry the disclosure ARIA attributes.
 * A wrapper anchor is accepted only when it contains a single trigger-like element, so the
 * popover never guesses between several controls.
 * @param anchor - Element held by `anchorRef`.
 * @example
 * const target = resolveAriaTarget(wrapper);
 * @returns The trigger element, or null when the anchor is not a usable trigger.
 */
const resolveAriaTarget: (anchor: HTMLElement) => HTMLElement | null = (
    anchor: HTMLElement,
): HTMLElement | null => {
    if (isTriggerLike(anchor)) {
        return anchor;
    }

    const candidates: HTMLElement[] = Array.from(anchor.querySelectorAll<HTMLElement>(TriggerSelector));

    return candidates.length === 1 ? candidates[0] : null;
};

/**
 * Captures the ARIA attributes the popover is about to change.
 * @param anchor - External trigger element.
 * @example
 * const snapshot = captureAnchorAria(button);
 * @returns The previous attribute values.
 */
const captureAnchorAria: (anchor: HTMLElement) => AnchorAriaSnapshot = (
    anchor: HTMLElement,
): AnchorAriaSnapshot => ({
    expanded: anchor.getAttribute("aria-expanded"),
    controls: anchor.getAttribute("aria-controls"),
});

/**
 * Restores the ARIA attributes captured before the popover bound to the trigger.
 * @param anchor - External trigger element.
 * @param snapshot - Previous attribute values.
 * @example
 * restoreAnchorAria(button, snapshot);
 * @returns Nothing.
 */
const restoreAnchorAria: (anchor: HTMLElement, snapshot: AnchorAriaSnapshot) => void = (
    anchor: HTMLElement,
    snapshot: AnchorAriaSnapshot,
): void => {
    if (snapshot.expanded === null) {
        anchor.removeAttribute("aria-expanded");
    } else {
        anchor.setAttribute("aria-expanded", snapshot.expanded);
    }

    if (snapshot.controls === null) {
        anchor.removeAttribute("aria-controls");
    } else {
        anchor.setAttribute("aria-controls", snapshot.controls);
    }
};

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
 * @param ariaLabel - Name for the modal dialog or for the labelled region of a non-modal popover.
 * @param closeOnEscape - Whether Escape asks the popover to close; defaults to `true`.
 * @param closeOnOutsidePress - Whether an outside press asks the popover to close; defaults to `true`.
 * @param restoreFocus - Whether focus returns to the anchor when it was inside the popover or the
 * popover is modal; defaults to `true`.
 * @param ref - Ref for the native floating wrapper.
 * Native div attributes (id, style, aria-*, data-*, tabIndex, and events) are forwarded to the
 * floating wrapper. The wrapper receives a stable generated `id` when none is supplied.
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
    /** Wraps the content in the default Surface card; set false for a caller-styled panel. */
    surface?: boolean;
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
 * Positions a Portal-rendered Surface against an anchor and dismisses it on outside press, Escape,
 * or tabbing out. The `open` state may be controlled or uncontrolled, and `onClose` reports the
 * reason (`backdrop`, `escape`, `outside`, or `tab`).
 * The floating wrapper carries a stable id, mirrors `aria-expanded`/`aria-controls` onto an
 * interactive anchor, and uses `role="dialog"` when modal or `role="region"` when a non-modal
 * popover has a label. Modal popovers trap focus; non-modal popovers let Tab pass through and
 * close when Tab would leave the panel.
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
    surface = true,
    className = "",
    onDismiss,
    ariaLabel,
    closeOnEscape = true,
    closeOnOutsidePress = true,
    restoreFocus = true,
    role: roleProp,
    ref,
    id,
    style: styleProp,
    tabIndex = -1,
    onBlur,
    onFocus,
    onKeyDown,
    "aria-label": ariaLabelAttribute,
    "aria-modal": ariaModalAttribute,
    ...rest
}: PopoverProps) => {
    const floatingRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const panelId: string = useId();
    const resolvedId: string = id ?? panelId;
    const wasOpenRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const hadFocusRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const suppressRestoreRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const anchorNodeRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const anchorSnapshotRef: MutableRefObject<AnchorAriaSnapshot | null> = useRef<AnchorAriaSnapshot | null>(null);
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
            suppressRestoreRef.current = reason === "outside" || reason === "tab";
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
            if (!event.defaultPrevented && event.key === "Escape") {
                requestClose("escape");
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return (): void => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [closeOnEscape, modal, open, requestClose]);

    useLayoutEffect((): void => {
        const anchor: HTMLElement | null = anchorRef.current;
        const target: HTMLElement | null = anchor === null ? null : resolveAriaTarget(anchor);

        if (target === null) {
            return;
        }

        const previousTarget: HTMLElement | null = anchorNodeRef.current;

        if (previousTarget !== null && previousTarget !== target && anchorSnapshotRef.current !== null) {
            restoreAnchorAria(previousTarget, anchorSnapshotRef.current);
            anchorSnapshotRef.current = null;
        }

        if (anchorSnapshotRef.current === null) {
            anchorSnapshotRef.current = captureAnchorAria(target);
        }

        anchorNodeRef.current = target;
        target.setAttribute("aria-expanded", open ? "true" : "false");

        if (open) {
            if (!target.hasAttribute("aria-controls")) {
                target.setAttribute("aria-controls", resolvedId);
            }

            return;
        }

        if (target.getAttribute("aria-controls") === resolvedId) {
            target.removeAttribute("aria-controls");
        }
    }, [anchorRef, open, resolvedId]);

    useEffect((): (() => void) => (): void => {
        const anchor: HTMLElement | null = anchorNodeRef.current;
        const snapshot: AnchorAriaSnapshot | null = anchorSnapshotRef.current;

        if (anchor !== null && snapshot !== null) {
            restoreAnchorAria(anchor, snapshot);
        }
    }, []);

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
        if (
            wasOpenRef.current &&
            !open &&
            restoreFocus &&
            !suppressRestoreRef.current &&
            (modal || hadFocusRef.current)
        ) {
            focusAnchor(anchorRef.current);
        }

        if (!open) {
            hadFocusRef.current = false;
            suppressRestoreRef.current = false;
        }

        wasOpenRef.current = open;
    }, [anchorRef, modal, open, restoreFocus]);

    const handleFocus: (event: ReactFocusEvent<HTMLDivElement>) => void = (
        event: ReactFocusEvent<HTMLDivElement>,
    ): void => {
        hadFocusRef.current = true;
        onFocus?.(event);
    };

    const handleBlur: (event: ReactFocusEvent<HTMLDivElement>) => void = (
        event: ReactFocusEvent<HTMLDivElement>,
    ): void => {
        const next: EventTarget | null = event.relatedTarget;

        if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
            hadFocusRef.current = false;
        }

        onBlur?.(event);
    };

    const handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        onKeyDown?.(event);

        if (event.defaultPrevented || event.key !== "Tab" || modal) {
            return;
        }

        const container: HTMLDivElement | null = floatingRef.current;
        const active: Element | null = document.activeElement;

        if (container === null || !(active instanceof HTMLElement) || !container.contains(active)) {
            return;
        }

        const focusable: HTMLElement[] = getFocusableItems(container);

        if (focusable.length > 0) {
            const first: HTMLElement = focusable[0];
            const last: HTMLElement = focusable[focusable.length - 1];
            const leaving: boolean = event.shiftKey ? active === first : active === last;

            if (!leaving) {
                return;
            }
        }

        // Move focus to the anchor before the browser performs the default Tab step, so focus
        // leaves the closing panel in the expected direction instead of falling to the body.
        focusAnchor(anchorRef.current);
        requestClose("tab");
    };

    if (!open) {
        return null;
    }

    const floatingStyle: CSSProperties = {
        ...style,
        zIndex: modal ? "var(--z-modal)" : "var(--z-dropdown)",
        ...styleProp,
    };
    const resolvedLabel: string | void = ariaLabelAttribute ?? ariaLabel;
    const resolvedRole: AriaRole | void =
        roleProp ?? (modal ? "dialog" : resolvedLabel !== (void 0) && resolvedLabel.length > 0 ? "region" : (void 0));
    const label: string | void = modal ? (resolvedLabel ?? "Popover") : resolvedLabel;
    return (
        <Portal>
            {modal ? (
                <Backdrop open className="popover__backdrop" onClick={(): void => requestClose("backdrop")} />
            ) : null}
            <div
                {...rest}
                ref={mergedRef}
                id={resolvedId}
                className={cx("popover", className)}
                style={floatingStyle}
                data-placement={resolvedPlacement}
                role={resolvedRole === (void 0) ? (void 0) : resolvedRole}
                aria-modal={modal ? true : ariaModalAttribute}
                aria-label={label === (void 0) || label.length === 0 ? (void 0) : label}
                tabIndex={tabIndex}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
            >
                {surface ? (
                    <Surface className="popover__surface" elevation={3} shape="md">
                        {children}
                    </Surface>
                ) : (
                    <div className="popover__plain">{children}</div>
                )}
            </div>
        </Portal>
    );
};

export default Popover;
