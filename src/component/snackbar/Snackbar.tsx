import { useEffect, type FC, type ReactNode } from "react";
import cx from "../foundation/cx";
import Portal from "../foundation/Portal";
import Surface from "../surface/Surface";
import Button from "../button/Button";
import "./Snackbar.css";

/**
 * Placement of a snackbar inside the viewport.
 * Type: type alias.
 * Fields: none.
 * @example
 * const anchor: SnackbarAnchor = "bottom-center";
 */
export type SnackbarAnchor = "bottom-left" | "bottom-center" | "bottom-right";

/**
 * Semantic tone of a snackbar.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: SnackbarTone = "success";
 */
export type SnackbarTone = "neutral" | "success" | "warning" | "danger";

/**
 * Props for the Material snackbar.
 * Type: interface.
 * Fields: open, message, actionLabel, onAction, onClose, autoHideDuration, anchor, tone, className.
 * @example
 * <Snackbar open={open} message="Saved" actionLabel="Undo" onAction={undo} onClose={close} />
 */
export interface SnackbarProps {
    open: boolean;
    message: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    onClose?: () => void;
    autoHideDuration?: number;
    anchor?: SnackbarAnchor;
    tone?: SnackbarTone;
    className?: string;
}

/**
 * Renders a transient Material snackbar above the page.
 * @param props - Open state, message, action, timeout, and placement.
 * @example
 * <Snackbar open={open} message="Saved quietly" autoHideDuration={4000} />
 * @returns A portalled snackbar, or null when closed.
 */
const Snackbar: FC<SnackbarProps> = ({
    open,
    message,
    actionLabel,
    onAction,
    onClose,
    autoHideDuration = 4000,
    anchor = "bottom-center",
    tone = "neutral",
    className = "",
}: SnackbarProps) => {
    useEffect((): (() => void) | void => {
        if (!open || autoHideDuration <= 0 || onClose === (void 0)) {
            return;
        }

        const timeout: number = window.setTimeout(onClose, autoHideDuration);

        return (): void => {
            window.clearTimeout(timeout);
        };
    }, [open, autoHideDuration, onClose]);

    if (!open) {
        return null;
    }

    return (
        <Portal>
            <div className={cx("snackbar", `snackbar--${anchor}`, className)}>
                <Surface
                    className={cx("snackbar__surface", `snackbar__surface--${tone}`)}
                    elevation={3}
                    shape="sm"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <span className="snackbar__message">{message}</span>
                    {actionLabel === (void 0) ? null : (
                        <Button
                            className="snackbar__action"
                            variant="ghost"
                            size="sm"
                            onClick={(): void => {
                                onAction?.();
                                onClose?.();
                            }}
                        >
                            {actionLabel}
                        </Button>
                    )}
                    {onClose === (void 0) ? null : (
                        <Button
                            className="snackbar__close"
                            variant="quiet"
                            size="sm"
                            icon="Close"
                            aria-label="Dismiss snackbar"
                            onClick={onClose}
                        />
                    )}
                </Surface>
            </div>
        </Portal>
    );
};

export default Snackbar;
