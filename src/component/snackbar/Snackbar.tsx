import {
    useCallback,
    useEffect,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
import cx from "../foundation/cx";
import Portal from "../foundation/Portal";
import useControllableState from "../foundation/useControllableState";
import Surface from "../surface/Surface";
import Button from "../button/Button";
import Icon, { type IconName } from "../icon/Icon";
import VisuallyHidden from "../foundation/VisuallyHidden";
import { useInternational, type InternationalContextValue } from "../../international";
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
 * Why the snackbar asked to close.
 * Type: type alias.
 * Fields: none.
 * @example
 * const reason: SnackbarCloseReason = "timeout";
 */
export type SnackbarCloseReason = "action" | "dismiss" | "timeout";

/**
 * Props for the Material snackbar.
 * Type: interface.
 * Fields: open, defaultOpen, onOpenChange, message, actionLabel, onAction, onClose, autoHideDuration,
 * anchor, tone, className, ref, plus native div attributes forwarded to the snackbar wrapper.
 * @example
 * <Snackbar open={open} message="Saved" actionLabel="Undo" onAction={undo} onClose={close} />
 */
export interface SnackbarProps extends HTMLAttributes<HTMLDivElement> {
    /** Controlled open state; omit to let the snackbar manage its own state. */
    open?: boolean;
    /** Initial open state when uncontrolled; defaults to `false`. */
    defaultOpen?: boolean;
    /** Called with the requested open state whenever the snackbar asks to open or close. */
    onOpenChange?: (open: boolean) => void;
    message: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    /** Called with the reason whenever the snackbar asks to close. */
    onClose?: (reason: SnackbarCloseReason) => void;
    autoHideDuration?: number;
    anchor?: SnackbarAnchor;
    tone?: SnackbarTone;
    /** Ref for the native snackbar wrapper. */
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a transient Material snackbar above the page.
 * The `open` state may be controlled or uncontrolled, and `onClose` reports the reason
 * (`action`, `dismiss`, or `timeout`).
 * @param props - Open state, message, action, timeout, placement, and native wrapper attributes.
 * @example
 * <Snackbar open={open} message="Saved quietly" autoHideDuration={4000} />
 * @returns A portalled snackbar, or null when closed.
 */
const Snackbar: FC<SnackbarProps> = ({
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    message,
    actionLabel,
    onAction,
    onClose,
    autoHideDuration = 4000,
    anchor = "bottom-center",
    tone = "neutral",
    className = "",
    ref,
    ...rest
}: SnackbarProps) => {
    const { t }: InternationalContextValue = useInternational();
    const [open, setOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: openProp,
        defaultValue: defaultOpen,
        onChange: onOpenChange,
    });
    const canAutoHide: boolean =
        openProp === (void 0) || onClose !== (void 0) || onOpenChange !== (void 0);
    const closeable: boolean = onClose !== (void 0) || openProp === (void 0);

    const requestClose: (reason: SnackbarCloseReason) => void = useCallback(
        (reason: SnackbarCloseReason): void => {
            setOpen(false);
            onClose?.(reason);
        },
        [onClose, setOpen],
    );

    useEffect((): (() => void) | void => {
        if (!open || autoHideDuration <= 0 || !canAutoHide) {
            return;
        }

        const timeout: number = window.setTimeout((): void => {
            requestClose("timeout");
        }, autoHideDuration);

        return (): void => {
            window.clearTimeout(timeout);
        };
    }, [open, autoHideDuration, canAutoHide, requestClose]);

    if (!open) {
        return null;
    }

    const toneIcon: IconName | undefined =
        tone === "success"
            ? "Success"
            : tone === "warning"
              ? "Warning"
              : tone === "danger"
                ? "Error"
                : (void 0);
    const toneLabel: string | undefined =
        tone === "success"
            ? t("success")
            : tone === "warning"
              ? t("warning")
              : tone === "danger"
                ? t("error")
                : (void 0);

    return (
        <Portal>
            <div {...rest} ref={ref} className={cx("snackbar", `snackbar--${anchor}`, className)}>
                <Surface
                    className={cx("snackbar__surface", `snackbar__surface--${tone}`)}
                    elevation={3}
                    shape="sm"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {toneIcon === (void 0) ? null : (
                        <span className="snackbar__status-icon" aria-hidden="true">
                            <Icon name={toneIcon} size={16} />
                        </span>
                    )}
                    <span className="snackbar__message">
                        {toneLabel === (void 0) ? null : (
                            <VisuallyHidden>{`${toneLabel}: `}</VisuallyHidden>
                        )}
                        {message}
                    </span>
                    {actionLabel === (void 0) ? null : (
                        <Button
                            className="snackbar__action"
                            variant="ghost"
                            size="sm"
                            onClick={(): void => {
                                onAction?.();
                                requestClose("action");
                            }}
                        >
                            {actionLabel}
                        </Button>
                    )}
                    {closeable ? (
                        <Button
                            className="snackbar__close"
                            variant="quiet"
                            size="sm"
                            icon="Close"
                            aria-label={t("dismiss")}
                            onClick={(): void => requestClose("dismiss")}
                        />
                    ) : null}
                </Surface>
            </div>
        </Portal>
    );
};

export default Snackbar;
