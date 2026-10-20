import {
    useEffect,
    useId,
    useRef,
    useState,
    type FC,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import Backdrop from "../../component/background/Backdrop";
import cx from "../../component/foundation/cx";
import Icon from "../../component/icon/Icon";
import Portal from "../../component/foundation/Portal";
import useControllableState from "../../component/foundation/useControllableState";
import useFocusTrap from "../../component/foundation/useFocusTrap";
import useMergedRef from "../../component/foundation/useMergedRef";
import Surface from "../../component/surface/Surface";
import "./Drawer.css";

/**
 * Edge from which the drawer enters. The `top` edge spans the viewport width
 * and drops the panel down from above.
 * Type: type alias.
 * Fields: none.
 * @example
 * const placement: DrawerPlacement = "top";
 */
export type DrawerPlacement = "left" | "right" | "top" | "bottom";

/**
 * Available drawer widths and heights.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: DrawerSize = "md";
 */
export type DrawerSize = "sm" | "md" | "lg";

/**
 * Why the drawer asked to close.
 * Type: type alias.
 * Fields: none.
 * @example
 * const reason: DrawerCloseReason = "escape";
 */
export type DrawerCloseReason = "backdrop" | "close-button" | "escape";

/**
 * Props for the edge drawer.
 * Type: interface.
 * Fields: open, defaultOpen, onOpenChange, onClose, title, description, children, footer,
 * placement, size, closeOnBackdrop, closeOnEscape, restoreFocus, className, ref, plus native
 * div attributes forwarded to the dialog panel.
 * The native `title` tooltip attribute is omitted because `title` carries the drawer heading.
 * @example
 * <Drawer open={open} onClose={close} title="Filters" placement="top">
 *     <FilterForm />
 * </Drawer>
 */
export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    /** Controlled open state; omit to let the drawer manage its own state. */
    open?: boolean;
    /** Initial open state when uncontrolled; defaults to `false`. */
    defaultOpen?: boolean;
    /** Called with the requested open state whenever the drawer opens or closes. */
    onOpenChange?: (open: boolean) => void;
    /** Called with the reason whenever the drawer asks to close. */
    onClose: (reason: DrawerCloseReason) => void;
    title?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    /** Edge the panel enters from; `top` spans the viewport width. Defaults to `right`. */
    placement?: DrawerPlacement;
    size?: DrawerSize;
    closeOnBackdrop?: boolean;
    /** Whether Escape asks the drawer to close; defaults to `true`. */
    closeOnEscape?: boolean;
    /** Whether focus returns to the opener on close; defaults to `true`. */
    restoreFocus?: boolean;
    className?: string;
    /** Ref for the native dialog panel. */
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders an edge-anchored Surface panel with a scrim, focus trap, and scroll lock.
 * Native attributes and handlers are forwarded to the dialog panel.
 * @param props - Open state, copy, placement, size, dismissal rules, and native panel attributes.
 * @example
 * <Drawer open={open} onClose={close} title="Details" placement="bottom">
 *     <RitualSummary />
 * </Drawer>
 * @returns A drawer portal, or null while closed.
 */
const Drawer: FC<DrawerProps> = ({
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onClose,
    title,
    description,
    children,
    footer,
    placement = "right",
    size = "md",
    closeOnBackdrop = true,
    closeOnEscape = true,
    restoreFocus = true,
    className = "",
    ref,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-modal": ariaModal,
    ...rest
}: DrawerProps): ReactElement | null => {
    const panelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const titleId: string = useId();
    const descriptionId: string = useId();
    const hasTitle: boolean = title !== (void 0) && title.length > 0;
    const hasDescription: boolean = description !== (void 0) && description.length > 0;
    const [open, setOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: openProp,
        defaultValue: defaultOpen,
        onChange: onOpenChange,
    });
    const [visible, setVisible]: [boolean, (next: boolean) => void] = useState<boolean>(open);
    const [closing, setClosing]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const mergedRef: RefCallback<HTMLDivElement> = useMergedRef<HTMLDivElement>(panelRef, ref);
    const labelledBy: string = ariaLabelledBy ?? (hasTitle ? titleId : "");
    const label: string = ariaLabel ?? (hasTitle || labelledBy.length > 0 ? "" : "Drawer");
    const describedBy: string = ariaDescribedBy ?? (hasDescription ? descriptionId : "");

    const requestClose: (reason: DrawerCloseReason) => void = (reason: DrawerCloseReason): void => {
        setOpen(false);
        onClose(reason);
    };

    // The drawer stays mounted for one exit beat; this presence state is the
    // animation boundary rather than derived application state.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect((): (() => void) | void => {
        if (open) {
            setVisible(true);
            setClosing(false);
            return;
        }

        if (!visible) {
            return;
        }

        setClosing(true);
        const timeout: number = window.setTimeout((): void => {
            setVisible(false);
            setClosing(false);
        }, 240);

        return (): void => {
            window.clearTimeout(timeout);
        };
    }, [open, visible]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useFocusTrap(panelRef, open && !closing, {
        onEscape: closeOnEscape ? (): void => requestClose("escape") : (void 0),
        returnFocus: restoreFocus,
    });

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

    const handleClose: () => void = (): void => {
        requestClose("close-button");
    };

    if (!visible) {
        return null;
    }

    return (
        <Portal>
            <div className={cx("drawer", className)} data-state={closing ? "closing" : "open"}>
                <Backdrop
                    open
                    className="drawer__backdrop"
                    onClick={closeOnBackdrop ? (): void => requestClose("backdrop") : (void 0)}
                />
                <div
                    {...rest}
                    ref={mergedRef}
                    className="drawer__panel"
                    data-placement={placement}
                    data-size={size}
                    role={rest.role ?? "dialog"}
                    aria-modal={ariaModal ?? true}
                    aria-labelledby={labelledBy.length > 0 ? labelledBy : (void 0)}
                    aria-label={label.length > 0 ? label : (void 0)}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                    tabIndex={rest.tabIndex ?? -1}
                >
                    <Surface className="drawer__surface" contentClassName="drawer__content">
                        <header className="drawer__header">
                            {hasTitle || hasDescription ? (
                                <div className="drawer__heading">
                                    {hasTitle ? (
                                        <h2 className="drawer__title" id={titleId}>
                                            {title}
                                        </h2>
                                    ) : null}
                                    {hasDescription ? (
                                        <p className="drawer__description" id={descriptionId}>
                                            {description}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                            <button
                                type="button"
                                className="drawer__close"
                                aria-label="Close drawer"
                                onClick={handleClose}
                            >
                                <Icon name="Close" size={20} />
                            </button>
                        </header>
                        <div className="drawer__body">{children}</div>
                        {footer === (void 0) ? null : <footer className="drawer__footer">{footer}</footer>}
                    </Surface>
                </div>
            </div>
        </Portal>
    );
};

export default Drawer;
