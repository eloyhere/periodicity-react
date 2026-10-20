import type { FC, ReactElement, ReactNode } from "react";
import Button from "../button/Button";
import cx from "../foundation/cx";
import Dialog, { type DialogProps } from "./Dialog";
import { useInternational, type InternationalContextValue } from "../../international";
import "./ConfirmDialog.css";

/**
 * Visual tone of the confirmation action.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: ConfirmDialogTone = "danger";
 */
export type ConfirmDialogTone = "default" | "danger";

/**
 * Props for the confirmation dialog.
 * Type: interface.
 * Fields: open, defaultOpen, onOpenChange, onClose, onConfirm, title, description, confirmLabel,
 * cancelLabel, tone, loading, className, plus all remaining dialog props and native dialog attributes.
 * @example
 * <ConfirmDialog
 *     open={open}
 *     onClose={close}
 *     onConfirm={remove}
 *     title="Delete ritual?"
 *     tone="danger"
 * />
 */
export interface ConfirmDialogProps
    extends Omit<DialogProps, "role" | "size" | "title" | "description" | "children" | "footer"> {
    title: string;
    description?: ReactNode;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: ConfirmDialogTone;
    loading?: boolean;
}

/**
 * Renders a destructive or neutral confirmation with an alert dialog role.
 * Remaining dialog props (open state, close rules, native attributes, and refs) pass through
 * to the underlying dialog.
 * @param props - Open state, callbacks, copy, tone, and loading flag.
 * @example
 * <ConfirmDialog
 *     open={open}
 *     onClose={close}
 *     onConfirm={confirm}
 *     title="Archive this ritual?"
 *     confirmLabel="Archive"
 * />
 * @returns An alert dialog element.
 */
const ConfirmDialog: FC<ConfirmDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    cancelLabel,
    tone = "default",
    loading = false,
    className = "",
    ...rest
}: ConfirmDialogProps): ReactElement => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedConfirmLabel: string = confirmLabel ?? t("confirm");
    const resolvedCancelLabel: string = cancelLabel ?? t("cancel");
    const isDanger: boolean = tone === "danger";
    const cancelFocus: string | void = isDanger ? "true" : (void 0);
    const confirmFocus: string | void = isDanger ? (void 0) : "true";

    const handleConfirm: () => void = (): void => {
        if (loading) {
            return;
        }

        onConfirm();
    };

    return (
        <Dialog
            {...rest}
            open={open}
            onClose={onClose}
            title={title}
            description={description}
            className={cx("confirm-dialog", className)}
            size="sm"
            role="alertdialog"
            footer={
                <>
                    <Button
                        variant="ghost"
                        data-autofocus={cancelFocus}
                        onClick={(): void => onClose("close-button")}
                    >
                        {resolvedCancelLabel}
                    </Button>
                    <Button
                        className={cx("confirm-dialog__confirm", isDanger && "confirm-dialog__confirm--danger")}
                        data-autofocus={confirmFocus}
                        disabled={loading}
                        aria-busy={loading}
                        onClick={handleConfirm}
                    >
                        {loading ? <span className="confirm-dialog__spinner" aria-hidden="true" /> : null}
                        {resolvedConfirmLabel}
                    </Button>
                    <span className="visually-hidden" role="status">
                        {loading ? t("processing") : ""}
                    </span>
                </>
            }
        >
            {null}
        </Dialog>
    );
};

export default ConfirmDialog;
