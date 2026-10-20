import {
    useEffect,
    useId,
    useRef,
    useState,
    type FC,
    type ReactElement,
    type ReactNode,
    type RefObject,
} from "react";
import Backdrop from "../../component/background/Backdrop";
import cx from "../../component/foundation/cx";
import Icon from "../../component/icon/Icon";
import Portal from "../../component/foundation/Portal";
import useFocusTrap from "../../component/foundation/useFocusTrap";
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
 * Props for the edge drawer.
 * Type: interface.
 * Fields: open, onClose, title, description, children, footer, placement, size, closeOnBackdrop, className.
 * @example
 * <Drawer open={open} onClose={close} title="Filters" placement="top">
 *     <FilterForm />
 * </Drawer>
 */
export interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    /** Edge the panel enters from; `top` spans the viewport width. Defaults to `right`. */
    placement?: DrawerPlacement;
    size?: DrawerSize;
    closeOnBackdrop?: boolean;
    className?: string;
}

/**
 * Renders an edge-anchored Surface panel with a scrim, focus trap, and scroll lock.
 * @param props - Open state, copy, placement, size, and dismissal rules.
 * @example
 * <Drawer open={open} onClose={close} title="Details" placement="bottom">
 *     <RitualSummary />
 * </Drawer>
 * @returns A drawer portal, or null while closed.
 */
const Drawer: FC<DrawerProps> = ({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    placement = "right",
    size = "md",
    closeOnBackdrop = true,
    className = "",
}: DrawerProps): ReactElement | null => {
    const panelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const titleId: string = useId();
    const descriptionId: string = useId();
    const hasTitle: boolean = title !== (void 0) && title.length > 0;
    const hasDescription: boolean = description !== (void 0) && description.length > 0;
    const [visible, setVisible]: [boolean, (next: boolean) => void] = useState<boolean>(open);
    const [closing, setClosing]: [boolean, (next: boolean) => void] = useState<boolean>(false);

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

    useFocusTrap(panelRef, open && !closing, { onEscape: onClose, returnFocus: true });

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
        onClose();
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
                    onClick={closeOnBackdrop ? handleClose : (void 0)}
                />
                <div
                    ref={panelRef}
                    className="drawer__panel"
                    data-placement={placement}
                    data-size={size}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={hasTitle ? titleId : (void 0)}
                    aria-label={hasTitle ? (void 0) : "Drawer"}
                    aria-describedby={hasDescription ? descriptionId : (void 0)}
                    tabIndex={-1}
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
