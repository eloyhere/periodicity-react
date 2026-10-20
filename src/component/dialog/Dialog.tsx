import {
    createElement,
    useEffect,
    useId,
    useRef,
    type DialogHTMLAttributes,
    type FC,
    type MouseEventHandler,
    type PointerEventHandler,
    type ReactElement,
    type ReactEventHandler,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type SyntheticEvent,
} from "react";
import cx from "../foundation/cx";
import useControllableState from "../foundation/useControllableState";
import useMergedRef from "../foundation/useMergedRef";
import Icon from "../icon/Icon";
import Surface from "../surface/Surface";
import "./Dialog.css";

/**
 * Available dialog widths.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: DialogSize = "md";
 */
export type DialogSize = "sm" | "md" | "lg";

/**
 * Heading levels available to the dialog title.
 * Type: type alias.
 * Fields: none.
 * @example
 * const level: DialogHeadingLevel = 2;
 */
export type DialogHeadingLevel = 2 | 3 | 4;

/**
 * Role announced by the dialog surface.
 * Type: type alias.
 * Fields: none.
 * @example
 * const role: DialogRole = "alertdialog";
 */
export type DialogRole = "dialog" | "alertdialog";

/**
 * Why the dialog asked to close.
 * Type: type alias.
 * Fields: none.
 * @example
 * const reason: DialogCloseReason = "escape";
 */
export type DialogCloseReason = "backdrop" | "close-button" | "escape" | "native";

/**
 * Props for the modal dialog.
 * Type: interface.
 * Fields: open, defaultOpen, onOpenChange, onClose, title, eyebrow, description, children, footer,
 * className, size, headingLevel, closeLabel, closeOnBackdrop, closeOnEscape, restoreFocus, role, ref.
 * Native dialog attributes (id, style, aria-*, data-*, tabIndex, and pointer, mouse and keyboard
 * events) are forwarded to the underlying `dialog` element.
 * @example
 * <Dialog open={open} onClose={close} title="New ritual">...</Dialog>
 */
export interface DialogProps
    extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "title" | "role" | "onClose"> {
    /** Controlled open state; omit to let the dialog manage its own state. */
    open?: boolean;
    /** Initial open state when uncontrolled; defaults to `false`. */
    defaultOpen?: boolean;
    /** Called with the requested open state whenever the dialog asks to open or close. */
    onOpenChange?: (open: boolean) => void;
    /** Called with the reason whenever the dialog asks to close. */
    onClose: (reason: DialogCloseReason) => void;
    title: string;
    eyebrow?: string;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    size?: DialogSize;
    headingLevel?: DialogHeadingLevel;
    closeLabel?: string;
    closeOnBackdrop?: boolean;
    /** Whether Escape asks the dialog to close; defaults to `true`. */
    closeOnEscape?: boolean;
    /** Whether focus returns to the opener on close; defaults to `true`. */
    restoreFocus?: boolean;
    role?: DialogRole;
    /** Ref for the native dialog element. */
    ref?: Ref<HTMLDialogElement>;
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

/**
 * Picks the first element to focus when the dialog opens.
 * @param dialog - Open dialog element.
 * @param title - Dialog heading, already made programmatically focusable.
 * @param panel - Dialog panel used as the last resort.
 * @example
 * const target = getInitialFocus(dialog, titleRef.current, panelRef.current);
 * @returns The focus target, or null when the dialog has no focusable content.
 */
const getInitialFocus: (
    dialog: HTMLDialogElement,
    title: HTMLElement | null,
    panel: HTMLElement | null,
) => HTMLElement | null = (
    dialog: HTMLDialogElement,
    title: HTMLElement | null,
    panel: HTMLElement | null,
): HTMLElement | null => {
    const autofocus: HTMLElement | null = dialog.querySelector<HTMLElement>("[data-autofocus]");

    if (autofocus !== null) {
        return autofocus;
    }

    const focusable: HTMLElement[] = Array.from(dialog.querySelectorAll<HTMLElement>(FocusableSelector));
    const control: HTMLElement | void = focusable.find(
        (node: HTMLElement): boolean => node.getClientRects().length > 0,
    );

    if (control !== (void 0)) {
        return control;
    }

    if (title !== null) {
        return title;
    }

    if (panel !== null) {
        panel.tabIndex = -1;
        return panel;
    }

    return null;
};

/**
 * Returns focus to the element that opened the dialog.
 * @param previousActive - Ref holding the opener, cleared after restoring.
 * @param restore - Whether focus should actually be restored.
 * @example
 * restoreFocus(previousActiveRef, true);
 * @returns Nothing.
 */
const restoreFocus: (previousActive: RefObject<HTMLElement | null>, restore: boolean) => void = (
    previousActive: RefObject<HTMLElement | null>,
    restore: boolean,
): void => {
    const opener: HTMLElement | null = previousActive.current;

    if (restore && opener !== null && opener.isConnected) {
        opener.focus({ preventScroll: true });
    }

    previousActive.current = null;
};

/**
 * Renders a native modal dialog with managed focus, dismiss and scroll locking.
 * The `open` state may be controlled or uncontrolled; `onClose` reports the reason
 * (`backdrop`, `close-button`, `escape`, or `native`).
 * @param props - Open state, labels, heading level, dismissal rules, native dialog attributes, and content.
 * @example
 * <Dialog open={open} onClose={() => setOpen(false)} title="New ritual">
 *     <TextInput label="Name" />
 * </Dialog>
 * @returns A modal dialog element.
 */
const Dialog: FC<DialogProps> = ({
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onClose,
    title,
    eyebrow,
    description,
    children,
    footer,
    className = "",
    size = "md",
    headingLevel = 2,
    closeLabel = "Close dialog",
    closeOnBackdrop = true,
    closeOnEscape = true,
    restoreFocus: restoreFocusOnClose = true,
    role = "dialog",
    ref,
    onCancel,
    onClick,
    onPointerDown,
    onPointerCancel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    ...rest
}: DialogProps): ReactElement => {
    const dialogRef: RefObject<HTMLDialogElement | null> = useRef<HTMLDialogElement>(null);
    const panelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const titleRef: RefObject<HTMLHeadingElement | null> = useRef<HTMLHeadingElement>(null);
    const previousActiveRef: RefObject<HTMLElement | null> = useRef<HTMLElement>(null);
    const syncingCloseRef: RefObject<boolean> = useRef<boolean>(false);
    const pointerDownOutsideRef: RefObject<boolean> = useRef<boolean>(false);
    const titleId: string = useId();
    const descriptionId: string = useId();
    const hasDescription: boolean = description !== (void 0) && description !== null;
    const hasBody: boolean = children !== null && children !== (void 0) && children !== false;
    const headingTag: "h2" | "h3" | "h4" = headingLevel === 3 ? "h3" : headingLevel === 4 ? "h4" : "h2";
    const [open, setOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: openProp,
        defaultValue: defaultOpen,
        onChange: onOpenChange,
    });
    const mergedRef: RefCallback<HTMLDialogElement> = useMergedRef<HTMLDialogElement>(dialogRef, ref);
    const labelledBy: string = [titleId, ariaLabelledBy ?? ""]
        .filter((value: string): boolean => value.length > 0)
        .join(" ");
    const describedBy: string = [hasDescription ? descriptionId : "", ariaDescribedBy ?? ""]
        .filter((value: string): boolean => value.length > 0)
        .join(" ");

    const requestClose: (reason: DialogCloseReason) => void = (reason: DialogCloseReason): void => {
        setOpen(false);
        onClose(reason);
    };

    useEffect((): (() => void) | void => {
        const dialog: HTMLDialogElement | null = dialogRef.current;

        if (dialog === null) {
            return;
        }

        if (open) {
            if (previousActiveRef.current === null) {
                previousActiveRef.current =
                    document.activeElement instanceof HTMLElement ? document.activeElement : null;
            }

            if (!dialog.open) {
                dialog.showModal();
            }

            const focusTarget: HTMLElement | null = getInitialFocus(
                dialog,
                titleRef.current,
                panelRef.current,
            );
            focusTarget?.focus({ preventScroll: true });

            return (): void => {
                if (dialog.open) {
                    syncingCloseRef.current = true;
                    dialog.close();
                }

                restoreFocus(previousActiveRef, restoreFocusOnClose);
            };
        }

        if (dialog.open) {
            syncingCloseRef.current = true;
            dialog.close();
        }

        restoreFocus(previousActiveRef, restoreFocusOnClose);
    }, [open, restoreFocusOnClose]);

    useEffect((): (() => void) | void => {
        if (!open) {
            return;
        }

        const body: HTMLElement = document.body;
        const previousOverflow: string = body.style.overflow;
        body.style.overflow = "hidden";

        return (): void => {
            body.style.overflow = previousOverflow;
        };
    }, [open]);

    const handleCancel: ReactEventHandler<HTMLDialogElement> = (
        event: SyntheticEvent<HTMLDialogElement>,
    ): void => {
        event.preventDefault();

        if (closeOnEscape) {
            requestClose("escape");
        }

        onCancel?.(event);
    };

    const handleNativeClose: () => void = (): void => {
        if (syncingCloseRef.current) {
            syncingCloseRef.current = false;
            return;
        }

        requestClose("native");
    };

    const handlePointerDown: PointerEventHandler<HTMLDialogElement> = (
        event: Parameters<PointerEventHandler<HTMLDialogElement>>[0],
    ): void => {
        const panel: HTMLDivElement | null = panelRef.current;
        const target: EventTarget | null = event.target;
        pointerDownOutsideRef.current =
            panel === null || !(target instanceof Node) || !panel.contains(target);
        onPointerDown?.(event);
    };

    const handlePointerCancel: PointerEventHandler<HTMLDialogElement> = (
        event: Parameters<PointerEventHandler<HTMLDialogElement>>[0],
    ): void => {
        pointerDownOutsideRef.current = false;
        onPointerCancel?.(event);
    };

    const handleClick: MouseEventHandler<HTMLDialogElement> = (
        event: Parameters<MouseEventHandler<HTMLDialogElement>>[0],
    ): void => {
        const startedOutside: boolean = pointerDownOutsideRef.current;
        pointerDownOutsideRef.current = false;

        if (closeOnBackdrop && startedOutside && event.target === event.currentTarget) {
            requestClose("backdrop");
        }

        onClick?.(event);
    };

    const handleCloseClick: () => void = (): void => {
        requestClose("close-button");
    };

    return (
        <dialog
            {...rest}
            ref={mergedRef}
            className={cx("dialog", `dialog--${size}`, className)}
            role={role}
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
            onCancel={handleCancel}
            onClose={handleNativeClose}
            onPointerDown={handlePointerDown}
            onPointerCancel={handlePointerCancel}
            onClick={handleClick}
        >
            <Surface
                ref={panelRef}
                className="dialog__panel"
                contentClassName="dialog__content"
                ripple={{ layer: "background", trigger: ["hover", "click"] }}
            >
                <header className="dialog__header">
                    <div className="dialog__heading">
                        {eyebrow === (void 0) || eyebrow.length === 0 ? null : (
                            <span className="dialog__eyebrow">{eyebrow}</span>
                        )}
                        {createElement(
                            headingTag,
                            { className: "dialog__title", id: titleId, ref: titleRef, tabIndex: -1 },
                            title,
                        )}
                    </div>
                    <button
                        type="button"
                        className="dialog__close"
                        aria-label={closeLabel}
                        onClick={handleCloseClick}
                    >
                        <Icon name="Close" size={20} />
                    </button>
                </header>
                {hasDescription || hasBody ? (
                    <div className="dialog__body">
                        {hasDescription ? (
                            <div className="dialog__description" id={descriptionId}>
                                {description}
                            </div>
                        ) : null}
                        {hasBody ? children : null}
                    </div>
                ) : null}
                {footer === (void 0) || footer === null ? null : (
                    <footer className="dialog__footer">{footer}</footer>
                )}
            </Surface>
        </dialog>
    );
};

export default Dialog;
